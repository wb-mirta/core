import type { RollupOptions, Plugin, NullValue } from 'rollup'
import multi from '@rollup/plugin-multi-entry'
import resolve from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'
import dotenv from '@dotenv-run/rollup'
import replace from '@rollup/plugin-replace'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

import del from './plugins/del'
import wbRulesImports from './plugins/wb-rules-imports'

const env = process.env.NODE_ENV
const isProduction = env === 'production'

const packagesPattern = /node_modules\/@?(.+)\/(.+)/
const modulesPattern = /(?:src\/)?wb-rules-modules\/(.*)/
const scriptsPattern = /(?:src\/)?(?:wb-rules\/)?(.*)/

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

export interface RollupConfigOptions {
  dotenv?: DotenvOptions
  plugins?: Plugin[]
}

/**
 * Создаёт заранее настроенную конфигурацию Rollup
 * @param plugins
 * @returns
 */
export function defineConfig(options: RollupConfigOptions = {}): RollupOptions {

  const { dotenv: dotenvOptions = {}, plugins = [] } = options

  const defaultPlugins = [

    del({
      targets: 'dist/*',
    }),

    multi({
      exclude: ['src/wb-rules/*.disabled.ts'],
      preserveModules: true,
    }),

    resolve(),

    ts(),

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
      plugins: ['@babel/plugin-transform-spread'],
    }),

    del({
      targets: 'dist/*/_virtual',
      hook: 'closeBundle',
    }),
  ]

  return {

    input: 'src/wb-rules/*.ts',

    plugins: [
      ...defaultPlugins,
      ...plugins,
    ],

    output: {

      format: 'cjs',
      strict: false,

      dir: 'dist/es5',

      preserveModules: true,

      entryFileNames(chunkInfo) {

        // console.log(process.cwd())
        // console.log(chunkInfo.name)
        // console.log(getEntry(chunkInfo.name))
        // console.log(chunkInfo)

        return getEntry(chunkInfo.name)

      },
    },
  }

}
