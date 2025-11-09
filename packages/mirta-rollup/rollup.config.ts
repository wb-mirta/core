import { definePackageConfig } from '#src/index'

export default definePackageConfig({
  input: [
    'src/index.ts',
    'src/config.ts',
    'src/config-package.ts',
    'src/utils/env-loader.ts',
  ],
})
