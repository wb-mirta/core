import type { ExternalOption, Plugin, RollupOptions, NullValue } from 'rollup'

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

const packagesPattern = /node_modules[\\/]@?(.+)[\\/](.+)/
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

function packageEntry(pkg: string, entry: string) {

  const key = entry ? `${pkg}/${entry}` : pkg

  // if (__DEV__)
  //   console.debug(`Package Entry: ${key}`)

  return `wb-rules-modules/packages/${key}.js`

}

function moduleEntry(entry: string) {

  // if (__DEV__)
  //   console.debug(`Module Entry: ${entry}`)

  return `wb-rules-modules/${entry}.js`

}

function scriptEntry(entry: string) {

  // if (__DEV__)
  //   console.debug(`Script Entry: ${entry}`)

  return `wb-rules/${entry}.js`

}

function getEntry(path: string) {

  if (path.startsWith('_virtual'))
    return path

  let match: RegExpExecArray | NullValue

  match = packagesPattern.exec(path)

  if (match) {

    // if (__DEV__)
    //   console.debug(match)

    return packageEntry(match[1].replace(/\/dist$/, ''), match[2])

  }

  match = modulesPattern.exec(path)

  if (match) {

    // if (__DEV__)
    //   console.debug(match)

    return moduleEntry(match[1])

  }

  match = scriptsPattern.exec(path)

  if (match) {

    // if (__DEV__)
    //   console.debug(match)

    return scriptEntry(match[1])

  }

  // console.log(`No one! ${path}`)

  return path

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

  const rootDir = monorepo?.rootDir

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
      cacheRoot: rootDir
        ? nodePath.resolve(rootDir, './node_modules/.rts2_cache')
        : void 0,
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
