import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { loadEnv } from '@mirta/rollup/env-loader'

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  resolve: {
    alias: [
      {
        find: /^@wb\/(.*?)$/,
        replacement: fileURLToPath(
          new URL('./src/wb-rules/$1', import.meta.url)
        ),
      },
      {
        find: /^@wbm\/(.*?)$/,
        replacement: fileURLToPath(
          new URL('./src/wb-rules-modules/$1', import.meta.url)
        ),
      },
    ],
  },
  test: {
    globals: true,
    env: loadEnv({ mode }),
    include: ['tests/**/*.{test,spec}.[jt]s'],
    setupFiles: [
      '@mirta/testing/setup-global'
    ],
  },
}))
