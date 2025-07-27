import ts from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import dts from 'rollup-plugin-dts'
import del from 'rollup-plugin-delete'

import { resolve } from 'node:path'
import { readFileSync } from 'fs'

// import { fileURLToPath } from 'node:url'

// const configPath = fileURLToPath(import.meta.url)
// const rootDir = dirname(configPath)

const packageDir = process.cwd()
const pkgPath = resolve(packageDir, 'package.json')

const pkg = JSON.parse(
  readFileSync(pkgPath, 'utf-8')
)

const external = [
  /node_modules/,
  'mirta',
  '@mirta/basics',
  '@mirta/polyfills',
  pkgPath,
]

// Проверка TypeScript выполняется только для первой конфигурации.
let hasTsChecked = false

const { exports: { '.': root } = {} } = pkg

const typesOutFile = root
  && root.import
  && root.import.types

const rollupConfigs = [
  createConfig('mjs', {
    file: 'dist/index.mjs',
    format: `es`,
    importAttributesKey: 'with',
  }),
]

if (typesOutFile) {

  rollupConfigs.push({
    input: 'dist/dts/index.d.ts',
    external,
    plugins: [
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

export default rollupConfigs

/**
 * @returns {import('rollup').RollupOptions}
 */
function createConfig(buildName, output, plugins = []) {

  if (!output) {

    console.error(`Invalid format: ${buildName}`)
    process.exit(1)

  }

  output.sourcemap = !!process.env.SOURCE_MAP
  output.externalLiveBindings = false

  const isProductionBuild = /\.prod\.[cm]?js$/.test(output.file)
  // Конечный билд для запуска в окружении Node.
  const isNodeBuild = buildName === 'cjs'
  // Билд для дальнейшей сборки с использованием бандлеров.
  const isBundlerEsmBuild = buildName === 'mjs'

  const tsPlugin = ts({
    tsconfig: resolve(packageDir, './tsconfig.build.json'),
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

  const nodePlugins = [nodeResolve(), commonjs()]

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
      ...nodePlugins,
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

function createReplacePlugin(
  isProduction,
  isBundlerEsmBuild,
  isNodeBuild
) {

  const __DEV__
    = isBundlerEsmBuild || (isNodeBuild && !isProduction)
      // Preserve to be handled by bundlers
      ? `(process.env.NODE_ENV !== 'production')`
      : JSON.stringify(!isProduction)

  const __TEST__
    = isBundlerEsmBuild || isNodeBuild
      ? `(process.env.NODE_ENV === 'test')`
      : 'false'

  const replacements = {
    __DEV__,
    __TEST__,
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
