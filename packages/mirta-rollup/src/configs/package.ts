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

/**
 * Класс ошибки сборки, расширяющий стандартный Error.
 *
 * @since 0.3.4
 *
 **/
export class BuildError extends Error {
  constructor(message: string) {

    super(message)

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, BuildError.prototype)

    this.name = 'BuildError'
    this.message = message

    Error.captureStackTrace(this, BuildError)

  }
}

/**
 * Опции конфигурации Rollup.
 *
 * @since 0.3.0
 *
 **/
interface RollupConfigOptions {
  /** Текущая рабочая директория. */
  cwd?: string
  input?: string | string[] | Record<string, string>
  external?: (string | RegExp)[]
  plugins?: Plugin[]
}

/**
 * Параметры сборки.
 *
 * @since 0.3.0
 *
 **/
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

/**
 * Описатель экспорта.
 *
 * @since 0.3.5
 *
 **/
interface ExportDescriptor {
  dtsOutputFile?: string
}

/**
 * Связь входного файла с выходным.
 *
 * @since 0.3.4
 *
 **/
interface InputBinding {
  outputFile: string
  dtsSourceFile: string
  dtsOutputFile?: string
}

const dtsOutputDir = 'dist/dts'

/**
 * Удаляет префикс './dist/' из пути.
 * @param path Путь к файлу.
 * @returns Нормализованный путь.
 *
 * @since 0.3.5
 *
 **/
function sliceDistPrefix(path: string) {

  return path.startsWith('./dist/')
    ? path.slice(7)
    : path

}

/**
 * Нормализует входные данные в массив строк.
 *
 * @param input Входные данные (строка, массив или объект).
 * @returns Массив путей к входным файлам.
 * @throws {BuildError} Если входная конфигурация пуста.
 *
 * @since 0.3.4
 *
 **/
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

  if (inputs.length === 0)
    throw new BuildError('[Mirta Rollup] Input configuration cannot be empty')

  return inputs

}

/**
 * Проверяет, является ли объект условной записью экспорта.
 *
 * @param source Объект для проверки.
 * @returns `true`, если объект содержит поле `import`.
 *
 * @since 0.3.5
 *
 **/
function isConditionalEntry(source: object): source is PackageExports.ConditionalEntry {

  return 'import' in source

}

/**
 * Обрабатывает условную запись экспорта.
 *
 * @param source Условная запись.
 * @returns Объект с полями entry и types.
 *
 * @since 0.3.5
 *
 **/
function processConditionalEntry(source: PackageExports.ConditionalEntry) {

  const result: {

    entry?: PackageExports.Path
    types?: PackageExports.Path

  } = {}

  if (source.import) {

    if (typeof source.import === 'string') {

      // Путь точки входа определён, типизация отсутствует.
      result.entry = source.import

    }
    else {

      result.entry = source.import.default
      result.types = source.import.types

    }

  }

  return result

}

/**
 * Проверяет наличие точки входа для типизации.
 *
 * @param entry Путь к точке входа.
 * @param types Путь к файлу типов.
 * @throws {BuildError} Если отсутствует точка входа.
 *
 * @since 0.3.5
 *
 **/
function ensureTypesHaveEntry(entry: PackageExports.Path, types: PackageExports.Path) {

  if (types && !entry)
    throw new BuildError(`[Mirta Rollup] Input file for "${types}" is missing in package.json`)

}

/**
 * Нормализует поле `exports` из package.json в словарь точек входа.
 *
 * @param exportsField Значение поля `exports`.
 * @returns Словарь точек входа с метаданными.
 * @throws {BuildError} Если конфигурация экспорта отсутствует или некорректна.
 *
 * @since 0.3.5
 *
 **/
function normalizeExports(exportsField: PackageExports) {

  if (!exportsField)
    throw new BuildError('[Mirta Rollup] Missing export configuration in package.json. Please define the "exports" field')

  if (Array.isArray(exportsField))
    throw new BuildError('[Mirta Rollup] The field "exports" in package.json must be either a string or an object, but found an array')

  const result: Record<string, ExportDescriptor> = {}

  if (typeof exportsField === 'string') {

    result[exportsField] = {}

    return result

  }

  if (isConditionalEntry(exportsField)) {

    const { entry, types } = processConditionalEntry(exportsField)

    ensureTypesHaveEntry(entry, types)

    if (entry)
      result[entry] = types
        ? { dtsOutputFile: types }
        : {}

    return result

  }

  for (const [key, value] of Object.entries<PackageExports.Entry>(exportsField)) {

    if (!value)
      continue

    if (!key.startsWith('.'))
      throw new BuildError(`[Mirta Rollup] Invalid export path "${key}" in package.json. Exports must start with "."`)

    let
      entry: PackageExports.Path,
      types: PackageExports.Path

    if (typeof value === 'string') {

      // Путь точки входа определён, типизация отсутствует.
      entry = value

    }
    else if (isConditionalEntry(value)) {

      ({ entry, types } = processConditionalEntry(value))

    }
    else {

      entry = value.default
      types = value.types

    }

    ensureTypesHaveEntry(entry, types)

    if (entry)
      result[entry] = types
        ? { dtsOutputFile: types }
        : {}

  }

  return result

}

/**
 * Создаёт отображение между входными файлами и выходными путями.
 *
 * @param inputs Массив исходных файлов.
 * @param normalizedExports Нормализованные дескрипторы экспорта.
 * @returns Словарь связей вход-выход.
 * @throws {BuildError} Если входной файл не связан с экспортом.
 *
 * @since 0.3.4
 *
 **/
function getInputBindings(
  inputs: string[],
  normalizedExports: Record<string, ExportDescriptor | undefined>
) {

  const bodyPattern = /^src\/(.*)\.[jt]s$/

  const result: Record<string, InputBinding | undefined> = {}

  const usedExports: string[] = []

  for (const input of inputs) {

    if (!input.startsWith('src/'))
      throw new BuildError(`[Mirta Rollup] Input path "${input}" must start with required prefix "src/"`)

    const match = bodyPattern.exec(input)

    if (!match)
      throw new BuildError(`[Mirta Rollup] Unsupported input "${input}". Please use valid JS or TS file extension`)

    const outputFile = `${match[1]}.mjs`
    const exportEntry = `./dist/${outputFile}`

    const descriptor = normalizedExports[exportEntry]

    // Проверяем наличие ключа в словаре.
    if (!descriptor)
      throw new BuildError(`[Mirta Rollup] The input file "${input}" is not associated with corresponding export "${exportEntry}" in the package.json`)

    result[input] = {
      outputFile,
      dtsSourceFile: `${dtsOutputDir}/${match[1]}.d.ts`,
      dtsOutputFile: descriptor.dtsOutputFile,
    }

    usedExports.push(exportEntry)

  }

  for (const key of Object.keys(normalizedExports)) {

    if (!usedExports.includes(key))
      throw new BuildError(
        `[Mirta Rollup] Export "${key}" defined in package.json has no corresponding input file in Rollup configuration`
      )

  }

  return result

}

// Проверка TypeScript выполняется только для первой конфигурации.
let hasTsChecked = false

/**
 * Определяет конфигурацию сборки на основе package.json.
 *
 * @param options Опции конфигурации Rollup.
 * @returns Массив конфигураций Rollup.
 *
 * @since 0.3.0
 *
 **/
export function definePackageConfig(options: RollupConfigOptions) {

  const {
    cwd = process.cwd(),
    input = 'src/index.ts',
    external = [],
    plugins,
  } = options

  const pkgPath = nodePath.resolve(cwd, 'package.json')

  const externalModules = [
    /node_modules/,
    pkgPath,
    ...external,
  ]

  const pkg = JSON.parse(
    readFileSync(pkgPath, 'utf-8')
  ) as Package

  const { exports = {} } = pkg

  const normalizedExports = normalizeExports(exports)

  const inputBindings = getInputBindings(
    normalizeInput(input),
    normalizedExports
  )

  // Создаёт отображение между файлами типов `.d.ts` и их выходными путями
  const dtsMappings = Object.values(inputBindings)
    .reduce<Record<string, string>>((mappings, nextValue) => {

      if (nextValue?.dtsOutputFile)
        mappings[nextValue.dtsSourceFile] = sliceDistPrefix(nextValue.dtsOutputFile)

      return mappings

    }, {})

  const dtsInputs = Object.keys(dtsMappings)

  const rollupConfigs = [
    createBuildConfig('mjs', {
      cwd,
      input,
      external: externalModules,
      emitDeclarations: dtsInputs.length > 0,
      plugins,
      output: {
        dir: 'dist/',
        format: 'es',
        importAttributesKey: 'with',
        entryFileNames(chunk) {

          if (chunk.facadeModuleId) {

            const localPath = nodePath
              .relative(cwd, chunk.facadeModuleId)
              .replaceAll(nodePath.sep, nodePath.posix.sep)

            const binding = inputBindings[localPath]

            if (binding)
              return binding.outputFile

          }

          return `${chunk.name}.mjs`

        },
        chunkFileNames: '[name].mjs',
      },
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
          targets: [dtsOutputDir],
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

/**
 * Создаёт конфигурацию сборки Rollup.
 *
 * @param buildName Имя сборки.
 * @param options Параметры сборки.
 * @returns Конфигурация Rollup.
 *
 * @since 0.3.0
 *
 **/
function createBuildConfig(
  buildName: string,
  options: BuildOptions
): RollupOptions {

  const { cwd, external, input, emitDeclarations, plugins = [], output } = options

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
      declarationDir: emitDeclarations ? dtsOutputDir : void 0,
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

/**
 * Создаёт плагин замены значений.
 *
 * @param isProduction Признак production-сборки.
 * @param isBundlerEsmBuild Признак сборки для bundler ESM.
 * @param isNodeBuild Признак сборки для Node.js.
 * @returns Плагин замены.
 *
 * @since 0.3.0
 *
 **/
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
