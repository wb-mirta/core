import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
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
    include: ['tests/**/*.{test,spec}.[jt]s'],
    setupFiles: [
      fileURLToPath(
        new URL('./tests/setup/dotenv.ts', import.meta.url)
      ),
      fileURLToPath(
        new URL('./tests/setup/mirta.ts', import.meta.url)
      ),
    ],
  },
})
