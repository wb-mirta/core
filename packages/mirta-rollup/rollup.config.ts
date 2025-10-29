import { definePackageConfig } from '#src/index'

export default definePackageConfig({
  input: [
    'src/index.ts',
    'src/configs/index.ts',
    'src/utils/env-loader.ts',
  ],
})
