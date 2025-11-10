import type { ExternalOption, Plugin, RollupOptions } from 'rollup'

import multi from '@rollup/plugin-multi-entry'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import { loadEnvReplacements, type EnvLoaderOptions } from '@mirta/env-loader'
import { resolveMonorepoContextAsync } from '@mirta/workspace'

import del from '#plugins/del'
import wbRulesImports from '#plugins/wb-rules-imports'

import nodePath from 'node:path'

import {

  findPackageByChunkName,
  toVirtualModulePath

} from '#utils/monorepo'

import { getEntryPath } from '#utils/entry-path'

const mode = process.env.NODE_ENV ?? 'development'
const isProduction = mode === 'production'

const outDir = 'dist/es5'

/**
 * Опции конфигурации сборки.
 *
 **/
export interface RuntimeConfigOptions {
  /** Корневая директория проекта. */
  cwd?: string
  /** Внешние зависимости, исключённые из сборки. */
  external?: ExternalOption

  /** Конфигурация загрузчика `.env`-файлов `dotenvx`, {@link EnvLoaderOptions}. */
  envLoader?: EnvLoaderOptions

  /** Дополнительные плагины. */
  plugins?: Plugin[]
}

/**
 * Собирает Rollup-конфигурацию для сборки runtime-кода проекта с учётом монорепозитория и подстановки переменных окружения.
 *
 * @param options - Параметры: `cwd` — рабочая директория проекта; `external` — список внешних зависимостей; `envLoader` — опции загрузчика окружения; `plugins` — дополнительные Rollup-плагины
 * @returns Сконфигурированный объект RollupOptions, готовый для сборки в каталог `dist/es5`
 * @since 0.3.0
 */
export async function defineRuntimeConfig(
  options: RuntimeConfigOptions = {}
): Promise<RollupOptions> {

  const {
    cwd = process.cwd(),
    external,
    envLoader: envLoaderOptions,
    plugins = [],

  } = options

  const monorepoContext = await resolveMonorepoContextAsync(cwd)

  const defaultPlugins = [

    // Очистка директории dist перед сборкой
    del({
      targets: outDir,
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

    // Подстановка переменных окружения
    replace({
      preventAssignment: true,
      values: {

        // Загрузка переменных окружения
        ...loadEnvReplacements({
          mode,
          cwd,
          rootDir: monorepoContext.rootDir,
          ...envLoaderOptions,
        }),

        // Признак сборки в режиме разработки
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
      targets: `${outDir}/_virtual`,
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

      dir: outDir,
      preserveModules: true,

      entryFileNames(chunk) {

        // Относительный путь от корня репозитория.
        let chunkName = chunk.name

        // Адаптация путей при сборке в монорепозитории.
        if (monorepoContext.packages.length !== 0) {

          const { rootDir } = monorepoContext

          // Преобразуем chunkName (относительный путь от корня монорепозитория)
          // в абсолютный путь для корректного сравнения с cwd (абсолютным путём
          // к текущему пакету).
          //
          const absolutePath = nodePath.resolve(rootDir, chunkName)

          if (absolutePath.startsWith(cwd)) {

            // Путь в текущем проекте, не требует встраивания отдельным пакетом.
            chunkName = nodePath
              .relative(cwd, absolutePath)
              .replaceAll(nodePath.sep, nodePath.posix.sep)

          }
          else {

            // Ищем пакет монорепозитория, в котором находится указанный путь.
            const pkgDefinition = findPackageByChunkName(monorepoContext, chunkName)

            if (pkgDefinition)
              chunkName = toVirtualModulePath(chunkName, pkgDefinition)

          }

        }

        return getEntryPath(chunkName)

      },
    },
  }

}
