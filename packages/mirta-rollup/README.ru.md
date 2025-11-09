# @mirta/rollup

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/rollup?style=flat-square)](https://npmjs.com/package/@mirta/rollup)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/rollup?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/rollup)

> Готовые конфигурации сборки с zero-config и возможностью кастомизации,  
> а также публичные API для загрузки `.env`-файлов и определения контекста проекта.

`@mirta/rollup` — это **основной инструмент сборки** экосистемы на базе фреймворка Мирта.

Он предоставляет:
- Готовые zero-config конфигурации для сборки под контроллеры Wiren Board и для публикации на NPM.
- Фабрики конфигураций для кастомизации.
- Утилиты для загрузки переменных окружения.
- Работу с контекстом проекта — на основе `@mirta/workspace`.

Используется как самим фреймворком, так и проектами, созданными через `create-mirta`.<br/>
**Не предназначен для выполнения в среде Duktape на контроллерах Wiren Board.**

## 🧩 Режимы сборки

### 1. `@mirta/rollup/config` — сборка под контроллер

Для проектов автоматизации на базе [wb-rules](https://github.com/wirenboard/wb-rules), исполняемых на контроллерах Wiren Board.

#### Использование

```bash
# Установка
pnpm add -D @mirta/rollup

# Сборка без rollup.config.mjs
rollup -c node:@mirta/rollup/config
```
#### Особенности

- Вход: `src/wb-rules/*.[jt]s`;
- Формат: `cjs`;
- Совместимость: Babel + `@mirta/polyfills`;
- Автоматическая адаптация `require()` через внутренний плагин `wb-rules-imports`;
- Переменные окружения:
  - загружаются из `.env*` файлов;
  - фильтруются по префиксам: `MIRTA_`, `APP_`;
- Поддержка монорепозиториев: использует `@mirta/workspace` для корректного разрешения зависимостей.

✅ Автоматически добавляется в проекты, сгенерированные через `create-mirta`, как `devDependency` — используется для их сборки.

### 2. `@mirta/rollup/config-package` — сборка в NPM-пакеты

Для проектов, распространяемых через NPM в виде подключаемых модулей экосистемы Мирта.

#### Использование

```sh
# Без rollup.config.mjs
rollup -c node:@mirta/rollup/config-package

# При сборке инструментов командной строки без exports
rollup -c node:@mirta/rollup/config-package --config-skip-exports

```
#### Особенности

- Вход: `src/index.ts`;
- Формат: `es` → `.mjs`;
- Валидация соответствия `src/` ↔ `package.json#exports`;
- Генерация типов: `.d.mts` через `rollup-plugin-dts` с исправлением алиасов;
- Внешние зависимости: корректно определяются с помощью `@mirta/workspace`.

✅ Автоматически добавляется в пакеты, сгенерированные через `create-mirta` с шаблоном "распространяемый модуль".

## 🛠 Фабрики конфигураций (для кастомизации)

Для полного контроля используйте прямые функции:

```ts
import { defineConfig, definePackageConfig } from '@mirta/rollup'

// Для проекта под контроллер
export default defineConfig({
  cwd: process.cwd(),
  external: [/^lodash/],
  envLoader: {
    prefix: 'APP_',
  },
})

// Для пакета
export default definePackageConfig({
  cwd: process.cwd(),
  input: 'src/main.ts',
  external: ['some-legacy-dep'],
})

```
### Преимущества
- Следуют стандартам сборки фреймворка Mirta;
- Позволяют расширять поведение по умолчанию;
- Идеальны для сложных проектов.

## 🧰 Публичные инфраструктурные API

### `@mirta/rollup/env-loader` - API загрузчика .env-файлов

Загружает и фильтрует переменные окружения из .env-файлов. Реализован на базе `dotenvx` и поддерживает шифрование.

[👉 Исходный код `env-loader`](https://github.com/wb-mirta/core/tree/latest/packages/mirta-rollup/src/utils/env-loader.ts)

#### Пример использования

```ts
import { loadEnv, loadEnvReplacements } from '@mirta/rollup/env-loader'

const mode = process.env.NODE_ENV

// Для использования в Vitest
const env = loadEnv({ mode, ...envLoaderOptions })

// Для использования в Rollup
const envReplacements = loadEnvReplacements({ mode, ...envLoaderOptions })

```

Загрузка переменных осуществляется согласно приоритетам:
- `.env.{mode}.local`
- `.env.{mode}`
- `.env.local`
- `.env`

Ищет файлы сначала в текущей директории проекта, затем — в корне монорепозитория (если обнаружен).

- Значения из `cwd` переопределяют значения из корня — это позволяет задавать локальные настройки;
- Фильтрует переменные по префиксам — по умолчанию: `MIRTA_` и `APP_`;
- Только `MIRTA_*` и `APP_*` попадают в `process.env`;
- Защищает от случайной утечки `SECRET_*`, `DATABASE_URL` и т.п.;
- Позволяет переопределить префиксы через `options.prefix`.

✅ Используется совместно с `@rollup/plugin-replace` через `loadEnvReplacements`, а также Vitest через `loadEnv`.

## 🔄 Архитектурная роль

Пакет обеспечивает **консистентность** и **предсказуемость** на всех уровнях экосистемы:

- Все пакеты фреймворка собираются с помощью `@mirta/rollup`;
- Генерируемые `create-mirta` пакеты используют конфигурации `@mirta/rollup/config` и `@mirta/rollup/config-package`, обеспечивая единый стандарт сборки для `wb-rules`.

Так формируется **замкнутая цепочка доверия**: инструмент, создающий проект, сам прошёл через тот же процесс, что и результат.
