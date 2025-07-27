# @mirta/rollup

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/rollup?style=flat-square)](https://npmjs.com/package/@mirta/rollup)

Предоставляет заранее настроенную конфигурацию Rollup для сборки проектов wb-rules.

## Установка
```sh
pnpm add -D @mirta/rollup
```
## Использование
```mjs
// rollup.config.mjs
import { defineConfig } from '@mirta/rollup'

export default defineConfig({
  dotenv: {
    prefix: '^APP_'
  }
})