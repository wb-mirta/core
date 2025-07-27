# @mirta/polyfils

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-polyfills/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-polyfills/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/polyfills?style=flat-square)](https://npmjs.com/package/@mirta/polyfills)

Коллекция полифилов, добавляющая часть возможностей новых версий стандарта ECMAScript, которые не поддерживаются текущей версией движка wb-rules. Используется для обеспечения работоспособности внутренних алгоритмов фреймворка.

## Установка
```sh
pnpm add @mirta/polyfills
```
## Использование
```ts
import '@mirta/polyfills'
```
Чтобы полифилы применились, достаточно импортировать их в скрипт правил или любой из подключенных модулей.

Благодаря отсутствию сторонних зависимостей, исходный код полифилов будет преобразован в модуль wb-rules-module для контроллера Wiren Board.
