# @mirta/polyfils

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-polyfills/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-polyfills/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/polyfills?style=flat-square)](https://npmjs.com/package/@mirta/polyfills)

These polyfills provide missing modern JavaScript features needed by the wb-rules engine to run internal framework algorithms correctly.

## Installation
```sh
pnpm add @mirta/polyfills
```
## Usage
```ts
import '@mirta/polyfills'
```
To use the polyfills, simply import them into the wb-rules script or any imported module.

Since there are no external dependencies, the polyfill source code will automatically convert into a wb-rules-compatible format for the Wiren Board controller.