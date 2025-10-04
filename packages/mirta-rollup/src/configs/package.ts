import ts from '@rollup/plugin-typescript'

import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
// import copy from 'rollup-plugin-copy'

import dts from 'rollup-plugin-dts'
import del from '../plugins/del'

import { resolve } from 'node:path'
import { readFileSync } from 'fs'
import type { RollupOptions, ModuleFormat, ImportAttributesKey, Plugin } from 'rollup'

interface RollupConfigOptions {
  /** Текущая рабочая директория. */
  cwd?: string
  external?: (string | RegExp)[]
  plugins?: Plugin[]
}

interface Package {
  exports: {
    '.': {
      import?: {
        types?: string
        default?: string
      }
    }
  }
}

interface BuildOptions {
  cwd: string
  external?: (string | RegExp)[]
  plugins?: Plugin[]
  output: {
    file: string
    format: ModuleFormat
    importAttributesKey: ImportAttributesKey
    sourcemap?: boolean
    externalLiveBindings?: boolean
  }
}

// Проверка TypeScript выполняется только для первой конфигурации.
let hasTsChecked = false
let typesOutFile: string | undefined

export function definePackageConfig(options: RollupConfigOptions) {

  const { cwd = process.cwd(), external = [], plugins } = options

  const pkgPath = resolve(cwd, 'package.json')

  const pkg = JSON.parse(
    readFileSync(pkgPath, 'utf-8')
  ) as Package

  const { exports: { '.': root } = {} } = pkg

  typesOutFile = root?.import?.types

  const externalModules = [
    /node_modules/,
    pkgPath,
    ...external,
  ]

  const rollupConfigs = [
    createBuildConfig('mjs', {
      cwd,
      external: externalModules,
      output: {
        file: 'dist/index.mjs',
        format: 'es',
        importAttributesKey: 'with',
      },
      plugins,
    }),
  ]

  if (typesOutFile) {

    rollupConfigs.push({
      input: 'dist/dts/index.d.ts',
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
      output: [{
        file: typesOutFile, format: 'es',
      }],
    })

  }

  return rollupConfigs

}

function createBuildConfig(
  buildName: string,
  options: BuildOptions,
  plugins: Plugin[] = []
): RollupOptions {

  const { cwd, external, output } = options

  output.sourcemap = !!process.env.SOURCE_MAP
  output.externalLiveBindings = false

  const isProductionBuild = /\.prod\.[cm]?js$/.test(output.file)
  // Конечный билд для запуска в окружении Node.
  const isNodeBuild = buildName === 'cjs'
  // Билд для дальнейшей сборки с использованием бандлеров.
  const isBundlerEsmBuild = buildName === 'mjs'

  const tsPlugin = ts({
    tsconfig: resolve(cwd, './tsconfig.build.json'),
    // cacheRoot: resolve(rootDir, './node_modules/.rts2_cache'),
    compilerOptions: {
      noCheck: hasTsChecked,

      declaration: !!typesOutFile,
      declarationDir: typesOutFile ? 'dist/dts' : void 0,
    },
    exclude: [
      'packages/*/tests',
    ],
  })

  // При запуске команды build, проверки TS и генерация определений
  // выполняются единожды - для первой конфигурации.
  hasTsChecked = true

  return {
    input: 'src/index.ts',
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

    __DEV__: isBundlerEsmBuild || (isNodeBuild && !isProduction)
      // Preserve to be handled by bundlers
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
