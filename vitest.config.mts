import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, configDefaults, type TestProjectConfiguration } from 'vitest/config'

const packagesDir = resolve('./packages')
const projects = readdirSync(packagesDir)

const entries: Record<string, string> = {}

// По умолчанию vite:import-analysis ищет точки входа
// пакетов в секции exports соответствующего файла package.json,
// однако тесты должны выполняться до сборки.
//
// Здесь осуществляется перенаправление на src/index.ts
//
projects.forEach((packageFolder) => {

  const packageName = packageFolder.startsWith('mirta-')
    ? packageFolder.replace(/^mirta-/, '@mirta/')
    : packageFolder

  const packageEntryPoint = join(packagesDir, packageFolder, 'src/index.ts')

  entries[packageName] = packageEntryPoint

})

export default defineConfig({
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  resolve: {
    alias: entries,
  },
  test: {
    globals: true,
    pool: 'threads',
    exclude: [
      ...configDefaults.exclude,
      '**/public/templates/**',
    ],
    projects: [
      ...projects.map<TestProjectConfiguration>(project => ({
        extends: true,
        root: `packages/${project}`,
        test: {
          name: project,
        },
      })),
    ],
  },
})
