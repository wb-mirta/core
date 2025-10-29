import { definePackageConfig } from '@mirta/rollup'

export default definePackageConfig({
  input: [
    'src/index.ts',
    'src/setup/global.ts',
  ],
})
