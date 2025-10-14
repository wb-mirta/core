import ts from '@rollup/plugin-typescript'

import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
// import copy from 'rollup-plugin-copy'

import dts from 'rollup-plugin-dts'
import del from '../plugins/del'

import nodePath from 'node:path'
import { readFileSync } from 'fs'

import type {
  RollupOptions,
  ModuleFormat,
  ImportAttributesKey,
  Plugin,
  PreRenderedChunk
} from 'rollup'

class BuildError extends Error {
  constructor(message: string) {

    super(message)

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, BuildError.prototype)

    this.name = 'BuildError'
    this.message = message

    Error.captureStackTrace(this, BuildError)

  }
}

interface RollupConfigOptions {
  /** Текущая рабочая директория. */
  cwd?: string
  input?: string | string[] | Record<string, string>
  external?: (string | RegExp)[]
  plugins?: Plugin[]
}

type PackageExports = Record<string, {
  import?: {
    types?: string
    default?: string
  }
}>

interface Package {
  exports?: PackageExports
}

interface BuildOptions {
  cwd: string
  input: string | string[] | Record<string, string>
  emitDeclarations: boolean
  external?: (string | RegExp)[]
  plugins?: Plugin[]
  output: {
    dir: string
    format: ModuleFormat
    importAttributesKey: ImportAttributesKey
    entryFileNames: string | ((chunkInfo: PreRenderedChunk) => string) | undefined
    chunkFileNames: string
    sourcemap?: boolean
    externalLiveBindings?: boolean
  }
}

interface InputBinding {
  sourceFile: string
  dtsSource: string
  outputFile: string
}

function normalizeInput(input: string | string[] | Record<string, string>) {

  const inputs: string[] = []

  // Нормализация входных данных.
  // Строка, массив или объект преобразуются в единый массив строк inputs.

  if (typeof input === 'string') {

    inputs.push(input)

  }
  else if (Array.isArray(input)) {

    inputs.push(...input)

  }
  else if (typeof input === 'object') {

    inputs.push(...Object.values(input))

  }

  return inputs

}

/**
 * Связывает исходные файлы проекта (`src/...`) с точками входа,
 * определенными в `package.exports`. Ее основная цель — создать
 * отображение между входными файлами (например, `src/index.ts`)
 * и их выходными файлами (например, `dist/index.js`), а также источниками типов (`.d.ts`).
 *
 * @param inputs Массив путей к исходным файлам (например, `['src/index.ts', 'src/utils.ts']`)
 * @param exports Объект из `package.exports`, описывающий точки входа пакета.
 *
 **/
function getInputBindings(
  inputs: string[],
  exports?: PackageExports
) {

  if (!inputs.length || !exports)
    return {}

  const candidates: Record<
    string,
    {
      key: string
      outputFile: string
      dtsSource: string
    } | undefined
  > = {}

  for (const [key, value] of Object.entries(exports)) {

    if (!value.import?.default || !key.startsWith('.'))
      continue

    // Формируем outputFile на основе данных package.json,
    // убирая префикс `dist/` из путей, так как он
    // уже указан в настройках сборки (output.dir).
    //
    const outputFile = value.import.default.startsWith('./dist/')
      ? value.import.default.slice(7)
      : value.import.default

    const source = key === '.' ? 'index' : key.slice(2)

    // Генерация кандидатов для входных файлов.
    //
    // Для каждого ключа экспорта создает возможные пути
    // к исходным файлам (например, `src/utils.ts` и `src/utils/index.ts`),
    // учитывая как явные, так и неявные структуры каталогов.

    Object.assign(candidates, {

      // Варианты явного пути (например, `src/setup.ts`)

      [`src/${source}.ts`]: { key, outputFile, dtsSource: source },
      [`src/${source}.js`]: { key, outputFile, dtsSource: source },

      // Варианты неявного пути (например, `src/setup/index.ts`):

      [`src/${source}/index.ts`]: { key, outputFile, dtsSource: `${source}/index` },
      [`src/${source}/index.js`]: { key, outputFile, dtsSource: `${source}/index` },
    })

  }

  const result: Record<string, InputBinding> = {}

  // Сопоставление с реальными входными файлами.
  //
  // Ппроверяет, какие из сгенерированных путей действительно существуют в массиве inputs.
  //
  for (const input of inputs) {

    const entry = candidates[input]

    // Если точка входа не ассоциирована с конфигурацией `package.json` — выбрасываем ошибку и прерываем сборку.
    if (!entry)
      throw new BuildError(`[Mirta Rollup] The input file "${input}" is not associated with corresponding export in the package.json`)

    // Формирует итоговый объект result, где ключи — это точки входа из package.exports,
    // а значения — связи между исходными файлами, выходными файлами и источниками типов.
    //
    result[entry.key] = {

      sourceFile: input,
      outputFile: entry.outputFile,
      dtsSource: entry.dtsSource,

    }

  }

  for (const key of Object.keys(exports)) {

    if (!(key in result))
      throw new BuildError(`[Mirta Rollup] Export "${key}" defined in package.json has no corresponding input file in Rollup configuration`)

  }

  return result

}

/**
 * Создаёт отображение между файлами типов `.d.ts` и их выходными путями
 * на основе данных из `package.exports` и ранее сформированных связей ({@link inputBindings})
 *
 * @param inputBindings
 * @param exports
 * @returns
 */
function getDtsMappings(inputBindings: Record<string, InputBinding | undefined>, exports?: PackageExports) {

  if (!exports)
    return {}

  const result: Record<string, string> = {}

  // Для каждой точки входа из package.exports
  //
  for (const [key, value] of Object.entries(exports)) {

    // Где указан import.types
    //
    if (!value.import?.types || !key.startsWith('.'))
      continue

    // Определяет путь к выходному файлу типов, убирая префикс `./dist/`
    //
    const outputFile = value.import.types.startsWith('./dist/')
      ? value.import.types.slice(7)
      : value.import.types

    const binding = inputBindings[key]

    // Если для указанного ключа отсутствует точка входа — выбрасываем ошибку и прерываем сборку.
    if (!binding)
      throw new BuildError(`[Mirta Rollup] Type definition "${outputFile}" has no corresponding input file`)

    // Связывает с исходным файлом типов.
    //
    const dtsSource = binding.dtsSource

    result[`dist/dts/${dtsSource}.d.ts`] = outputFile

  }

  return result

}

// Проверка TypeScript выполняется только для первой конфигурации.
let hasTsChecked = false

export function definePackageConfig(options: RollupConfigOptions) {

  const {
    cwd = process.cwd(),
    input = 'src/index.ts',
    external = [],
    plugins,
  } = options

  const pkgPath = nodePath.resolve(cwd, 'package.json')

  const pkg = JSON.parse(
    readFileSync(pkgPath, 'utf-8')
  ) as Package

  const { exports = {} } = pkg

  const externalModules = [
    /node_modules/,
    pkgPath,
    ...external,
  ]

  const inputBindings = getInputBindings(
    normalizeInput(input),
    exports
  )

  const outputMappings = Object.keys(inputBindings)
    .reduce<Record<string, string>>((mappings, nextKey) => {

      const inputMap = inputBindings[nextKey]
      mappings[inputMap.sourceFile] = inputMap.outputFile

      return mappings

    }, {})

  const dtsMappings = getDtsMappings(inputBindings, exports)

  const dtsInputs = Object.keys(dtsMappings)

  const rollupConfigs = [
    createBuildConfig('mjs', {
      cwd,
      input,
      external: externalModules,
      emitDeclarations: dtsInputs.length > 0,
      output: {
        dir: 'dist/',
        format: 'es',
        importAttributesKey: 'with',
        entryFileNames(chunk) {

          if (chunk.facadeModuleId) {

            const localPath = nodePath
              .relative(cwd, chunk.facadeModuleId)
              .replaceAll(nodePath.sep, nodePath.posix.sep)

            if (outputMappings[localPath])
              return outputMappings[localPath]

          }

          return `${chunk.name}.mjs`

        },
        chunkFileNames: '[name].mjs',
      },
      plugins,
    }),
  ]

  if (dtsInputs.length > 0) {

    rollupConfigs.push({
      input: dtsInputs,
      external: externalModules,
      plugins: [
        nodeResolve(),
        commonjs(),
        dts(),
        del({
          targets: ['dist/dts'],
          hook: 'closeBundle',
        }),
      ],
      output: {
        dir: 'dist/',
        format: 'es',
        entryFileNames(chunk) {

          if (chunk.facadeModuleId) {

            const localPath = nodePath
              .relative(cwd, chunk.facadeModuleId)
              .replaceAll(nodePath.sep, nodePath.posix.sep)

            if (dtsMappings[localPath])
              return dtsMappings[localPath]

          }

          return `${chunk.name}.mts`

        },
      },
    })

  }

  return rollupConfigs

}

function createBuildConfig(
  buildName: string,
  options: BuildOptions,
  plugins: Plugin[] = []
): RollupOptions {

  const { cwd, external, input, emitDeclarations, output } = options

  output.sourcemap = !!process.env.SOURCE_MAP
  output.externalLiveBindings = false

  const isProductionBuild = process.env.NODE_ENV === 'production'
  // Конечный билд для запуска в окружении Node.
  const isNodeBuild = buildName === 'cjs'
  // Билд для дальнейшей сборки с использованием бандлеров.
  const isBundlerEsmBuild = buildName === 'mjs'

  const tsPlugin = ts({
    tsconfig: nodePath.resolve(cwd, './tsconfig.build.json'),
    compilerOptions: {
      noCheck: hasTsChecked,
      declaration: emitDeclarations,
      declarationDir: emitDeclarations ? 'dist/dts' : void 0,
    },
    exclude: [
      'packages/*/tests',
    ],
  })

  // При запуске команды build, проверки TS и генерация определений
  // выполняются единожды - для первой конфигурации.
  hasTsChecked = true

  return {
    input,
    external,
    plugins: [
      tsPlugin,
      createReplacePlugin(
        isProductionBuild,
        isBundlerEsmBuild,
        isNodeBuild
      ),
      nodeResolve(),
      commonjs(),
      ...plugins,
      // copy({
      //   targets: [
      //     { src: 'public/*', dest: 'dist' },
      //   ],
      // }),
    ],
    output,
  }

}

function createReplacePlugin(
  isProduction: boolean,
  isBundlerEsmBuild: boolean,
  isNodeBuild: boolean
) {

  const replacements = {

    // Preserve to be handled by bundlers

    __DEV__: isBundlerEsmBuild || (isNodeBuild && !isProduction)
      ? `(process.env.NODE_ENV !== 'production')`
      : JSON.stringify(!isProduction),

    __TEST__: isBundlerEsmBuild || isNodeBuild
      ? `(process.env.NODE_ENV === 'test')`
      : 'false',

  }

  // Allow inline overrides like
  // __DEV__=true pnpm build
  Object.keys(replacements).forEach((key) => {

    if (key in process.env)
      replacements[key] = process.env[key]

  })

  return replace({
    preventAssignment: true,
    values: replacements,
    delimiters: ['\\b', '\\b(?![\\.\\:])'],
  })

}
