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

import { getMonorepoContextAsync, findMonorepoPackageByChunkName, mapChunkToPackage } from '#utils/monorepo'
import { getEntryPath } from '#utils/entry-path'

const env = process.env.NODE_ENV
const isProduction = env === 'production'

const outputDir = {
  es5: 'dist/es5',
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

  const monorepoContext = await getMonorepoContextAsync(cwd)

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

        // Адаптация путей при сборке в монорепозитории.
        if (monorepoContext) {

          const { rootDir } = monorepoContext

          const absolutePath = nodePath.resolve(rootDir, chunkInfo.name)

          if (absolutePath.startsWith(cwd)) {

            // Путь в текущем проекте, не требует встраивания отдельным пакетом.
            chunkName = nodePath
              .relative(cwd, absolutePath)
              .replaceAll(nodePath.sep, nodePath.posix.sep)

          }
          else {

            // Ищем пакет монорепозитория, в котором находится указанный путь.
            const pkgDefinition = findMonorepoPackageByChunkName(monorepoContext, chunkName)

            if (pkgDefinition)
              chunkName = mapChunkToPackage(chunkName, pkgDefinition)

          }

        }

        return getEntryPath(chunkName)

      },
    },
  }

}
