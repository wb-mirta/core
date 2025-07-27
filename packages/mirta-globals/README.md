# @mirta/globals

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-globals/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-globals/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/globals?style=flat-square)](https://npmjs.com/package/@mirta/globals)

Provides a complete set of necessary types enabling development of wb-rules in TypeScript.

## Installation

```sh
pnpm add -D @mirta/globals
```
Add following lines to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "types": [
      "@mirta/globals",
      "node"
    ]
  }
}
```