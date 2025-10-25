import ts from '@rollup/plugin-typescript'

import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'

import dts from 'rollup-plugin-dts'
import del from '#plugins/del'

import { dtsAlias } from '#ast/index'

import nodePath from 'node:path'

import type {
  RollupOptions,
  ExternalOption,
  ModuleFormat,
  ImportAttributesKey,
  Plugin,
  PreRenderedChunk
} from 'rollup'

import { NpmBuildError } from '#utils/errors'
import { parsePackageJson } from '#utils/package'
import { createExternalFilter } from '#utils/external-filter'

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
 * @throws {NpmBuildError} Если входная конфигурация пуста.
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
 * @throws {NpmBuildError} Если отсутствует точка входа.
 *
 * @since 0.3.5
 *
 **/
function assertTypesHaveEntry(entry: PackageExports.Path, types: PackageExports.Path) {

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
function normalizeExports(exportsField: PackageExports) {

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

  for (const [key, value] of Object.entries<PackageExports.Entry>(exportsField)) {

    if (!value)
      continue

    if (!key.startsWith('.'))
      throw NpmBuildError.get('exportMustStartWithDot', key)

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

    assertTypesHaveEntry(entry, types)

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
 * @param skipExports Позволяет пропустить проверку экспорта.
 * @returns Словарь связей вход-выход.
 * @throws {NpmBuildError} Если входной файл не связан с экспортом.
 *
 * @since 0.3.4
 *
 **/
function getInputBindings(
  inputs: string[],
  normalizedExports: Record<string, ExportDescriptor | undefined>,
  skipExports: boolean
) {

  const bodyPattern = /^src\/(.*)\.[jt]s$/

  const result: Record<string, InputBinding | undefined> = {}

  const usedExports = new Set<string>()
  const producingOutputs = new Set<string>()

  for (const input of inputs) {

    if (!input.startsWith('src/'))
      throw NpmBuildError.get('inputPathRequiresPrefix', input, 'src/')

    const match = bodyPattern.exec(input)

    if (!match)
      throw NpmBuildError.get('inputFileExtensionNotSupported', input)

    const outputFile = `${match[1]}.mjs`

    if (producingOutputs.has(outputFile))
      throw NpmBuildError.get('inputGeneratesDuplicateOutput', outputFile)

    producingOutputs.add(outputFile)

    const exportEntry = `./dist/${outputFile}`

    usedExports.add(exportEntry)

    const descriptor = normalizedExports[exportEntry]

    // Проверяем наличие ключа в словаре экспорта (при необходимости).
    if (!descriptor && !skipExports)
      throw NpmBuildError.get('inputHasNoExport', input, exportEntry)

    result[input] = {
      outputFile,
      dtsSourceFile: `${dtsOutputDir}/${match[1]}.d.ts`,
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
export function definePackageConfig(options: RollupConfigOptions = {}) {

  const {
    cwd = process.cwd(),
    input = 'src/index.ts',
    external = [],
    plugins,
    skipExports = false,
  } = options

  const pkgPath = nodePath.resolve(cwd, 'package.json')

  const externalFilter = createExternalFilter(
    cwd,
    [
      /node_modules/,
      pkgPath,
    ],
    external
  )

  const { exports = {} } = parsePackageJson(pkgPath)

  const normalizedExports = !skipExports
    ? normalizeExports(exports)
    : {}

  const inputBindings = getInputBindings(
    normalizeInput(input),
    normalizedExports,
    skipExports
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
      external: externalFilter,
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
      external: externalFilter,
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
          { src: 'public/*', dest: 'dist' },
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
