import { defineConfig } from '@mirta/rollup'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

import pkg from './package.json' with { type: 'json' }

const configPath = fileURLToPath(import.meta.url)
const rootDir = dirname(configPath)

// Специальная конфигурация для сборки проектов с примерами
// в монорепозитории.
//
export default defineConfig({
  monorepo: {
    rootDir,
    workspaces: pkg.workspaces,
  },
  dotenv: {
    /**
     * При использовании префикса, переменные
     * окружения будут отфильтрованы по нему.
     *
     * Например, префиксу APP_ соответствует
     * переменная окружения APP_NAME.
     *
     **/
    prefix: '^APP_',
  },
})
