# @mirta/rollup

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/rollup?style=flat-square)](https://npmjs.com/package/@mirta/rollup)

Supplies a ready-to-use Rollup configuration for compiling wb-rules projects.

## Installation
```sh
pnpm add -D @mirta/rollup
```
## Usage
```mjs
// rollup.config.mjs
import { defineConfig } from '@mirta/rollup'

export default defineConfig({
  dotenv: {
    prefix: '^APP_'
  }
})