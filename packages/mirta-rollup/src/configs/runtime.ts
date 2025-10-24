import type { ExternalOption, Plugin, RollupOptions } from 'rollup'

import multi from '@rollup/plugin-multi-entry'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'
import dotenv from '@dotenv-run/rollup'
import replace from '@rollup/plugin-replace'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

import del from '#plugins/del'
import wbRulesImports from '#plugins/wb-rules-imports'

import nodePath from 'node:path'

import { getWorkspaceContextAsync } from '#utils/workspace'
import { globRelative } from '#utils/path'

const env = process.env.NODE_ENV
const isProduction = env === 'production'

const packagesPattern = /(.*)node_modules[\\/]@?(.+)[\\/](.+)?/

const outputDir = {
  es5: 'dist/es5',
}

/**
 * Парсит путь к исходному файлу и возвращает имя модуля формата `wb-rules-modules/...`.
 * Используется для обработки путей внутри node_modules.
 *
 * @param sourcePath - путь к исходному файлу
 * @returns Строка с именем модуля или undefined
 *
 * @since 0.3.2
 *
 **/
function tryGetPackageEntry(sourcePath: string) {

  const pathParts: string[] = []

  do {

    const match = packagesPattern.exec(sourcePath)

    if (!match)
      break

    if (match[3])
      pathParts.unshift(match[3])

    pathParts.unshift('packages/' + match[2].replace(/\/dist$/, ''))

    sourcePath = match[1]

  }
  while (sourcePath)

  if (pathParts.length)
    return `wb-rules-modules/${pathParts.join('/')}.js`

}

/**
 * Определяет имя входного файла для типов `wb-rules` и `wb-rules-modules`.
 *
 * @param sourcePath - путь к исходному файлу
 * @param type - тип модуля (wb-rules или wb-rules-modules)
 * @returns Строка с именем файла или undefined
 *
 * @since 0.3.5
 *
 **/
function tryGetEntry(sourcePath: string, type: 'wb-rules' | 'wb-rules-modules') {

  const match = new RegExp(`(?:src[\\\\/])?${type}[\\\\/](.*)`).exec(sourcePath)

  if (!match)
    return

  // if (__DEV__)
  //   console.debug(`${type} Entry: ${sourcePath}`)

  return `${type}/${match[1]}.js`

}

/**
 * Финальная функция определения имени выходного файла.
 * Проверяет разные сценарии и возвращает корректный путь.
 *
 * @param path - исходный путь
 * @returns Строка с финальным именем файла
 *
 * @since 0.3.0
 *
 **/
function getEntry(path: string) {

  if (path.startsWith('_virtual'))
    return path

  return tryGetPackageEntry(path)
    ?? tryGetEntry(path, 'wb-rules-modules')
    ?? tryGetEntry(path, 'wb-rules')
    // None of the above matched.
    ?? path

}

/**
 * Опции для загрузки переменных окружения через dotenv.
 *
 **/
export interface DotenvOptions {
  /** Префикс для фильтрации переменных окружения. */
  prefix?: string
  /** Вывод в консоль значений переменных окружения. */
  unsecure?: boolean
  /** Вывод в консоль отладочной информации. */
  verbose: boolean
}

/**
 * Опции конфигурации сборки.
 *
 **/
export interface RuntimeConfigOptions {
  /** Корневая директория проекта. */
  cwd?: string
  /** Внешние зависимости, исключённые из сборки. */
  external?: ExternalOption
  /** Опции dotenv. */
  dotenv?: DotenvOptions
  /** Дополнительные плагины. */
  plugins?: Plugin[]
}

/**
 * Основная функция, возвращающая конфигурацию Rollup.
 * Обрабатывает входные файлы, плагины и настройку выходных путей.
 *
 * @param options - опции конфигурации
 * @returns Объект RollupOptions
 *
 * @since 0.3.0
 *
 **/
export async function defineRuntimeConfig(
  options: RuntimeConfigOptions = {}
): Promise<RollupOptions> {

  const {
    cwd = process.cwd(),
    external,
    dotenv: dotenvOptions = {},
    plugins = [],

  } = options

  const workspaceContext = await getWorkspaceContextAsync(cwd)

  const defaultPlugins = [

    // Очистка директории dist перед сборкой
    del({
      targets: 'dist/*',
    }),

    // Поддержка множественных входных файлов
    multi({
      exclude: ['src/wb-rules/*.disabled.[jt]s'],
      preserveModules: true,
    }),

    // Поиск зависимостей в node_modules
    resolve(),

    // Транспиляция TypeScript
    ts({ clean: true }),

    // Обработка импортов для wb-rules
    wbRulesImports(),

    // Загрузка переменных окружения
    dotenv(dotenvOptions),

    // Замена условных флагов в коде
    replace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(!isProduction),
        // Автоматически меняется в процессе тестирования
        __TEST__: 'false',
      },
    }),

    // Транспиляция через Babel
    getBabelOutputPlugin({
      presets: ['@babel/preset-env'],
      plugins: [
        '@babel/plugin-transform-spread',
        'array-includes',
      ],
    }),

    // Очистка виртуальных файлов после сборки
    del({
      targets: 'dist/*/_virtual',
      hook: 'closeBundle',
    }),
  ]

  return {

    input: 'src/wb-rules/*.[jt]s',

    external,

    plugins: [
      ...defaultPlugins,
      ...plugins,
    ],

    output: {

      format: 'cjs',
      strict: false,

      dir: outputDir.es5,
      preserveModules: true,

      entryFileNames(chunkInfo) {

        let chunkName = chunkInfo.name

        if (workspaceContext) {

          const { rootDir, workspaces } = workspaceContext

          const absolutePath = nodePath.resolve(rootDir, chunkInfo.name)

          if (absolutePath.startsWith(cwd)) {

            // Путь в текущем проекте.

            chunkName = nodePath
              .relative(cwd, absolutePath)

          }
          else {

            for (const workspace of workspaces) {

              const maybeChunkName = globRelative(chunkName, workspace)

              if (maybeChunkName) {

                // Обманка для упрощённого встраивания в packages.
                chunkName = 'node_modules/' + maybeChunkName
                break

              }

            }

          }

        }

        return getEntry(chunkName)

      },
    },
  }

}
