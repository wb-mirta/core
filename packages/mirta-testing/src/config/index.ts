import nodePath from 'node:path'
import { defineConfig, configDefaults, type TestProjectConfiguration } from 'vitest/config'
import { resolveMonorepoContextAsync } from '@mirta/rollup/context'
import { loadEnv } from '@mirta/rollup/env-loader'

const cwd = process.cwd()
const { packages } = await resolveMonorepoContextAsync(cwd)

const projects = packages.length > 0
  ? packages.map<TestProjectConfiguration>(pkg => ({
      extends: true,
      root: pkg.workspacePath,
      test: {
        name: pkg.name,
        typecheck: {
          enabled: true,
        },
      },
    }))
  : undefined

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  resolve: {
    // По умолчанию vite:import-analysis ищет точки входа
    // пакетов в секции exports соответствующего файла package.json,
    // однако тесты должны выполняться до сборки.
    //
    // Здесь осуществляется перенаправление на src/index.ts
    alias: packages.reduce<Record<string, string>>((items, nextItem) => {

      items[nextItem.name] = nodePath.join(cwd, nextItem.workspacePath, 'src', 'index.ts')

      return items

    }, {}),
  },
  test: {
    environment: 'node',
    globals: true,
    isolate: false,
    watch: false,
    exclude: [
      ...configDefaults.exclude,
      '**/public/templates/**',
      '**/dist/**',
    ],
    env: loadEnv({ mode }),
    setupFiles: [
      '@mirta/testing/setup-global',
    ],
    projects,
  },
}))
