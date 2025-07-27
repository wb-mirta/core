# @mirta/globals

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-globals/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-globals/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/globals?style=flat-square)](https://npmjs.com/package/@mirta/globals)

Содержит все необходимые типы для разработки правил wb-rules на TypeScript.

## Установка

```sh
pnpm add -D @mirta/globals
```
Добавьте следующие строки в ваш `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": [
      "node"
      "@mirta/globals",
    ]
  }
}
```