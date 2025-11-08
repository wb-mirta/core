/**
 * @file Генерирует конфигурации Rollup на основе `package.json`.
 *
 * Главная функция — `definePackageConfig`. Она:
 * - Читает `exports` и сопоставляет с `input`
 * - Генерирует ESM-бандл и, при необходимости, `.d.ts`
 * - Поддерживает запуск из корня монорепозитория (через `cwd`)
 *
 * Используется для сборки пакетов в монорепозитории.
 *
 * @since 0.3.0
 *
 **/

import ts from '@rollup/plugin-typescript'

import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'

import dts from 'rollup-plugin-dts'
import del from '#plugins/del'

import { dtsAlias } from '#ast'

import nodePath from 'node:path'

import type {
  RollupOptions,
  ExternalOption,
  ModuleFormat,
  ImportAttributesKey,
  Plugin,
  PreRenderedChunk
} from 'rollup'

import {

  readPackage,
  type ExportsConditional,
  type ExportsEntry,
  type ExportsPath,
  type PackageExports

} from '@mirta/package'

import { toPosix } from '@mirta/workspace'

import { NpmBuildError } from '../utils/errors'
import { createExternalFilter } from '../utils/external-filter'

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

  external?: ExternalOption

  plugins?: Plugin[]

  /**
   * Игнорирует отсутствие или некорректность секции `exports`,
   * если пакет собирается для целей запуска исполняемых файлов (поле `bin`).
   *
   * Полезно при сборке проектов, которые распространяются
   * только как готовые приложения, а не как модули,
   * содержащие экспортируемый API.
   *
   * @since 0.3.5
   *
   **/
  skipExports?: boolean

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
  external?: ExternalOption
  plugins?: Plugin[]
  outPath: string
  outPathDts: string
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
  readonly outputFile: string
  readonly dtsSourceFile: string
  readonly dtsOutputFile?: string
}

const outDir = 'dist'
const outDirDts = `${outDir}/dts`

/**
 * Удаляет префикс каталога вывода (`./${outDir}/`) из пути.
 * @param path Путь к файлу.
 * @returns Нормализованный путь.
 *
 * @since 0.3.5
 *
 **/
function sliceDistPrefix(path: string) {

  const prefix = `./${outDir}/`

  return path.startsWith(prefix)
    ? path.slice(prefix.length)
    : path

}

/**
 * Нормализует входные данные в массив строк.
 *
 * @param input Входные данные (строка, массив или объект).
 * @returns Массив путей к входным файлам.
 * @throws {NpmBuildError} Если входная конфигурация пуста.
 *
 * @since 0.3.4
 *
 **/
function normalizeInput(input: string | string[] | Record<string, string>) {

  const inputs: string[] = []

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
    throw NpmBuildError.get('inputEmpty')

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
function isConditionalEntry(source: object): source is ExportsConditional {

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
function processConditionalEntry(source: ExportsConditional) {

  const result: {

    entry?: ExportsPath
    types?: ExportsPath

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
 * @throws {NpmBuildError} Если отсутствует точка входа.
 *
 * @since 0.3.5
 *
 **/
function assertTypesHaveEntry(entry: ExportsPath, types: ExportsPath) {

  if (types && !entry)
    throw NpmBuildError.get('exportTypesOnly', types)

}

/**
 * Нормализует поле `exports` из package.json в словарь точек входа.
 *
 * @param exportsField Значение поля `exports`.
 * @returns Словарь точек входа с метаданными.
 * @throws {NpmBuildError} Если конфигурация экспорта отсутствует или некорректна.
 *
 * @since 0.3.5
 *
 **/
export function normalizeExports(exportsField: PackageExports) {

  if (!exportsField)
    throw NpmBuildError.get('exportEmpty')

  if (Array.isArray(exportsField))
    throw NpmBuildError.get('exportDisallowArrayType')

  const result: Record<string, ExportDescriptor> = {}

  if (typeof exportsField === 'string') {

    result[exportsField] = {}

    return result

  }

  if (isConditionalEntry(exportsField)) {

    const { entry, types } = processConditionalEntry(exportsField)

    assertTypesHaveEntry(entry, types)

    if (entry)
      result[entry] = types
        ? { dtsOutputFile: types }
        : {}

    return result

  }

  for (const [key, value] of Object.entries<ExportsEntry>(exportsField)) {

    if (!value)
      continue

    if (!key.startsWith('.'))
      throw NpmBuildError.get('exportMustStartWithDot', key)

    let
      entry: ExportsPath,
      types: ExportsPath

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

    assertTypesHaveEntry(entry, types)

    if (entry)
      result[entry] = types
        ? { dtsOutputFile: types }
        : {}

  }

  return result

}

/**
 * Сопоставляет входные файлы (`src/*.ts`) с выходными (`./dist/*.mjs`)
 * на основе поля `exports` из `package.json`.
 *
 * @param inputs Локальные пути (`src/index.ts`)
 * @param normalizedExports Словарь `exportPath → { dtsOutputFile }`
 * @param skipExports Пропустить проверку (для `bin`-пакетов)
 * @returns Словарь `input → { outputFile, dtsSourceFile, dtsOutputFile }`
 *
 * @throws NpmBuildError если:
 *   - `input` не начинается с `src/`
 *   - `input` не имеет соответствия в `exports`
 *   - `exports` не имеет соответствия в `input`
 *   - `types` указан без `import`/`default`
 *
 * @since 0.3.4
 *
 **/
export function createInputBindings(
  inputs: string[],
  normalizedExports: Record<string, ExportDescriptor | undefined>,
  skipExports: boolean
) {

  // Извлекает имя файла без расширения и префикса src.
  const filePattern = /^(?:.*\/)?src\/(.*)\.[jt]s$/

  const result: Record<string, InputBinding | undefined> = {}

  const usedExports = new Set<string>()
  const producingOutputs = new Set<string>()

  for (const input of inputs) {

    if (!input.startsWith('src/'))
      throw NpmBuildError.get('inputPathRequiresPrefix', input, 'src/')

    const match = filePattern.exec(input)

    if (!match)
      throw NpmBuildError.get('inputFileExtensionNotSupported', input)

    const outputFile = `${match[1]}.mjs`

    if (producingOutputs.has(outputFile))
      throw NpmBuildError.get('inputGeneratesDuplicateOutput', outputFile)

    producingOutputs.add(outputFile)

    const exportEntry = `./${outDir}/${outputFile}`

    usedExports.add(exportEntry)

    const descriptor = normalizedExports[exportEntry]

    // Проверяем наличие ключа в словаре экспорта (при необходимости).
    if (!descriptor && !skipExports)
      throw NpmBuildError.get('inputHasNoExport', input, exportEntry)

    result[input] = {
      outputFile,
      dtsSourceFile: `${outDirDts}/${match[1]}.d.ts`,
      dtsOutputFile: descriptor?.dtsOutputFile,
    }

  }

  for (const key of Object.keys(normalizedExports)) {

    // Выявляем незадействованные ключи в словаре экспорта (обратная проверка).
    if (!usedExports.has(key))
      throw NpmBuildError.get('exportHasNoInput', key)

  }

  return result

}

/**
 * Создаёт отображение между промежуточными файлами типов `.d.ts` и их финальными выходными путями.
 * Используется для настройки `entryFileNames` в конфигурации Rollup для `.d.ts`-бандла.
 *
 * @param inputBindings Словарь связей входных файлов с выходными путями.
 * @returns Словарь отображений: ключ — промежуточный путь `.d.ts` (например, `dist/dts/index.d.ts`),
 *          значение — финальное имя файла (например, `index.d.mts`).
 * @example
 * ```ts
 * const mappings = createDtsMappings({
 *   'src/index.ts': {
 *     outputFile: 'index.mjs',
 *     dtsSourceFile: 'dist/dts/index.d.ts',
 *     dtsOutputFile: './dist/index.d.mts'
 *   }
 * })
 * // Возвращает: { 'dist/dts/index.d.ts': 'index.d.mts' }
 * ```
 * @since 0.4.0
 *
 **/
export function createDtsMappings(inputBindings: Record<string, InputBinding | undefined>) {

  const mappings: Record<string, string> = {}

  for (const binding of Object.values(inputBindings)) {

    if (binding?.dtsOutputFile)
      mappings[binding.dtsSourceFile] = sliceDistPrefix(binding.dtsOutputFile)

  }

  return mappings

}

/**
 * Возвращает относительный путь от корня монорепозитория до пакета с завершающим слешем.
 *
 * Используется для:
 * - Преобразования локальных путей (`src/index.ts`) → глобальные (`packages/name/src/index.ts`)
 * - Формирования входов для `dts`-сборки (`packages/name/dist/dts/index.d.ts`)
 *
 * @param cwdRoot Корень монорепозитория (где запущен Rollup)
 * @param cwdPackage Директория пакета
 * @returns Относительный путь вида `'packages/mirta-rollup/'`, или `''`, если это корень
 *
 * @example
 *
 * ```ts
 * getPackagePrefix('/repo', '/repo/packages/core') → 'packages/core/'
 *
 * ```
 *
 * @since 0.4.0
 *
 **/
function getPackagePrefix(cwdRoot: string, cwdPackage: string) {

  const packagePrefix = toPosix(nodePath.relative(cwdRoot, cwdPackage))

  return packagePrefix
    ? `${packagePrefix}/`
    : ''

}

// Проверка TypeScript выполняется только для первой конфигурации.
let hasTsChecked = false

/**
 * Создаёт конфигурации Rollup для пакета на основе его `package.json`.
 *
 * Поддерживает:
 * - ESM-бандл (обязательно)
 * - `.d.ts`-бандл (если в `exports` указаны `types`)
 * - Режим запуска из корня монорепозитория (через `packagePrefix`)
 * - Проверки соответствия `input` ↔ `exports`
 *
 * @param options Настройки сборки
 * @returns Массив конфигураций Rollup
 *
 * @example
 *
 * ```ts
 * definePackageConfig({
 *   cwd: '/repo/packages/my-package',
 *   input: 'src/index.ts',
 * })
 *
 * ```
 * @since 0.3.0
 *
 **/
export function definePackageConfig(options: RollupConfigOptions = {}) {

  // Реальная директория запуска может отличаться от директории пакета `cwd`.
  const cwdRoot = process.cwd()

  const {
    cwd = cwdRoot,
    input = 'src/index.ts',
    external = [],
    plugins,
    skipExports = false,
  } = options

  const packagePrefix = getPackagePrefix(cwdRoot, cwd)

  const outDirPath = nodePath.join(cwd, outDir)
  const outDirDtsPath = nodePath.join(cwd, outDirDts)

  const pkgPath = nodePath.resolve(cwd, 'package.json')

  const externalFilter = createExternalFilter(
    cwd,
    [
      /node_modules/,
      pkgPath, // Для предотвращения встраивания `package.json` в бандл
    ],
    external
  )

  const normalizedInput = normalizeInput(input)

  const { exports = {} } = readPackage(pkgPath)

  const normalizedExports = !skipExports
    ? normalizeExports(exports)
    : {}

  const inputBindings = createInputBindings(
    normalizedInput,
    normalizedExports,
    skipExports
  )

  const dtsMappings = createDtsMappings(inputBindings)

  const dtsInputs = Object.keys(dtsMappings)
    .map(item => `${packagePrefix}${item}`)

  const rollupConfigs = [
    createBuildConfig('mjs', {
      cwd,
      input: normalizedInput.map(input => `${packagePrefix}${input}`),
      external: externalFilter,
      emitDeclarations: dtsInputs.length > 0,
      plugins,
      outPath: outDirPath,
      outPathDts: outDirDtsPath,
      output: {
        dir: outDirPath,
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
      external: externalFilter,
      plugins: [
        nodeResolve(),
        commonjs(),
        dts(),
        del({
          targets: outDirDtsPath,
          hook: 'closeBundle',
        }),
      ],
      output: {
        dir: outDirPath,
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

  const { cwd, external, input, emitDeclarations, plugins = [], outPath, outPathDts, output } = options

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
      outDir: outPath,
      declaration: emitDeclarations,
      declarationDir: emitDeclarations ? outPathDts : void 0,
    },
    exclude: [
      'packages/*/tests',
    ],
    transformers: {
      afterDeclarations: [
        dtsAlias(),
      ],
    },
  })

  // При запуске команды build, проверки TS и генерация определений
  // выполняются единожды - для первой конфигурации.
  hasTsChecked = true

  return {
    input,
    external,
    plugins: [
      // Очистка директории dist перед сборкой
      del({
        targets: outPath,
      }),
      tsPlugin,
      createReplacePlugin(
        isProductionBuild,
        isBundlerEsmBuild,
        isNodeBuild
      ),
      nodeResolve(),
      commonjs(),
      ...plugins,
      copy({
        targets: [
          { src: 'public/*', dest: outPath },
        ],
      }),
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
