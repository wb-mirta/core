import type { ExternalOption, Plugin, RollupOptions } from 'rollup'

import multi from '@rollup/plugin-multi-entry'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'
import dotenv from '@dotenv-run/rollup'
import replace from '@rollup/plugin-replace'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

import del from '../plugins/del'
import wbRulesImports from '../plugins/wb-rules-imports'

import nodePath from 'node:path'

const env = process.env.NODE_ENV
const isProduction = env === 'production'

const packagesPattern = /(.*)node_modules[\\/]@?(.+)[\\/](.+)?/
const modulesPattern = /(?:src[\\/])?wb-rules-modules[\\/](.*)/
const scriptsPattern = /(?:src[\\/])?(?:wb-rules[\\/])?(.*)/

const outputDir = {
  es5: 'dist/es5',
}

function globRelative(path: string, pattern: string) {

  const pathParts = path.split('/')
  const patternParts = pattern.split('/')

  let i = 0 // Индекс текущего компонента пути.

  for (let j = 0; j < patternParts.length && i < pathParts.length; j++) {

    switch (patternParts[j]) {
      case '*':
        break
      case '**':
        while (i < pathParts.length && !pathParts[i].startsWith(patternParts[j + 1])) {

          i += 1 // Пропускаем все элементы пути до следующего элемента шаблона.

        }
        break
      default:
        if (patternParts[j] === pathParts[i]) {

          i += 1

        }
        else {

          return void 0 // Несоответствие фиксированного значения.

        }
    }

  }

  return pathParts.slice(i).join('/')

}

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

function tryGetModuleEntry(sourcePath: string) {

  const match = modulesPattern.exec(sourcePath)

  if (!match)
    return

  // if (__DEV__)
  //   console.debug(`Module Entry: ${entry}`)

  return `wb-rules-modules/${match[1]}.js`

}

function tryGetScriptEntry(sourcePath: string) {

  const match = scriptsPattern.exec(sourcePath)

  if (!match)
    return

  // if (__DEV__)
  //   console.debug(`Script Entry: ${entry}`)

  return `wb-rules/${match[1]}.js`

}

function getEntry(path: string) {

  if (path.startsWith('_virtual'))
    return path

  return tryGetPackageEntry(path) ?? tryGetModuleEntry(path) ?? tryGetScriptEntry(path)
    // None of the above matched.
    ?? path

}

export interface DotenvOptions {
  /** Prefix to filter environment variables. */
  prefix?: string
  /** Print environment variables values. */
  unsecure?: boolean
  /** Print debug information. */
  verbose: boolean
}

export interface RuntimeConfigOptions {
  cwd?: string
  external?: ExternalOption
  /** Настройки для сборки в монорепозитории. */
  monorepo?: {
    rootDir: string
    workspaces: string[]
  }
  dotenv?: DotenvOptions
  plugins?: Plugin[]
}

export function defineRuntimeConfig(
  options: RuntimeConfigOptions = {}
): RollupOptions {

  const {
    cwd = process.cwd(),
    external,
    monorepo,
    dotenv: dotenvOptions = {},
    plugins = [],

  } = options

  const defaultPlugins = [
    del({
      targets: 'dist/*',
    }),

    multi({
      exclude: ['src/wb-rules/*.disabled.[jt]s'],
      preserveModules: true,
    }),

    resolve(),

    ts({
      clean: true,
    }),

    wbRulesImports(),

    dotenv(dotenvOptions),

    replace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(!isProduction),
        // Автоматически меняется в процессе тестирования
        __TEST__: 'false',
      },
    }),

    getBabelOutputPlugin({
      presets: ['@babel/preset-env'],
      plugins: [
        '@babel/plugin-transform-spread',
        'array-includes',
      ],
    }),

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

        if (monorepo) {

          const { rootDir, workspaces } = monorepo

          const absolutePath = nodePath.resolve(rootDir, chunkInfo.name)

          if (absolutePath.startsWith(cwd)) {

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
