# `@mirta/env-loader`

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-env-loader/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-env-loader/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/env-loader?style=flat-square)](https://npmjs.com/package/@mirta/env-loader)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/env-loader?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/env-loader)

> Внутренний загрузчик переменных окружения на базе `@dotenvx/dotenvx`, используемый инструментами Mirta.

`@mirta/env-loader` обеспечивает единый способ загрузки и фильтрации переменных окружения в рамках фреймворка Mirta.

Поддерживает:
- `.env`-файлы с режимами (`development`, `test`, `production`) и `.local`-файлами
- Переменные из операционной системы и CLI-переопределения
- Фильтрацию по префиксам (`MIRTA_`, `APP_`)
- Шифрование `.env`-файлов через `@dotenvx/dotenvx`

Используется в `@mirta/rollup`, `@mirta/testing` и других внутренних инструментах.

**Не предназначен для выполнения в среде Duktape на контроллерах Wiren Board.**

## 📦 Установка

```bash
# Не требуется напрямую — используется внутри Mirta
pnpm add -D @mirta/env-loader
```

⚠️ Этот пакет — часть внутренней инфраструктуры фреймворка Mirta. Обычно он не используется напрямую.

## 🚀 Быстрый старт

```ts
import { loadEnv } from '@mirta/env-loader'

// Загрузка переменных окружения
const env = loadEnv({ mode: 'development' })

// Для подстановки в код (например, @rollup/plugin-replace)
const replacements = loadEnvReplacements({ mode: 'production' })
```

## 🧰 API

### `loadEnv(options?: EnvLoaderOptions): Record<string, string>`
Синхронно загружает и фильтрует переменные окружения.

#### Параметры

| Поле | Тип | Описание |
|------|-----|----------|
| `mode` | `string` | Режим окружения. По умолчанию — `process.env.NODE_ENV` |
| `prefix` | `string \| string[]` | Префиксы для фильтрации. По умолчанию — `['MIRTA_', 'APP_']` |
| `cwd` | `string` | Текущая рабочая директория. По умолчанию — `process.cwd()` |
| `rootDir` | `string` | Корневая директория проекта (например, в монорепозитории).<br/>Если значение указано и отличается от `cwd`, файлы ищутся также и в корне |
| `envFile` | `string \| string[]` | Базовое имя `.env`-файла. По умолчанию — `.env` |
| `keepNodeEnv` | `boolean` | Сохранять ли `NODE_ENV`. По умолчанию — `true` |
| `dotenv` | `DotenvOptions` | Дополнительные настройки `@dotenvx/dotenvx` |

### Порядок загрузки файлов

Файлы обрабатываются в порядке убывания приоритета:

1. **Сначала — все `.env`-файлы в `cwd`** (текущей директории):
   - `.env.${mode}.local`
   - `.env.${mode}`
   - `.env.local`
   - `.env`

2. **Затем — все `.env`-файлы в `rootDir`** (корне проекта), в том же порядке.

#### ⚠️ Локальные настройки пакета имеют приоритет над корневыми

Предположим, что:
- некий разрабатываемый проект собирается в режиме `development`,
- файл пакета `packages/my-app/.env` содержит `PORT=3000`,
- корневой файл проекта `.env.development` содержит `PORT=4000`.

В этом случае будет использовано значение `PORT=3000`,<br/>
потому что локальный контекст считается более специфичным.

#### ⚠️ Поведение при совпадении ключей зависит от значения `dotenv.overload`

- **`dotenv.overload`: `false`** (по умолчанию)

  Переменные из **первых** файлов **не перезаписываются** последующими.<br/>
  → Чем **раньше** файл в списке — тем **выше** его приоритет.

- **`dotenv.overload`: `true`**

  Последующие файлы **перезаписывают** предыдущие.<br/>
  → Чем **позже** файл в списке — тем **выше** его приоритет.

По умолчанию используется `overload`: `false`, поэтому `.env.${mode}.local` имеет наивысший приоритет.

---

### `loadEnvReplacements(options?: EnvLoaderOptions): Record<string, string>`

Возвращает объект вида:

```ts
{
  'process.env.APP_PORT': '"3000"',
  'import.meta.env.APP_PORT': '"3000"'
}
```
Подходит для интеграции с `@rollup/plugin-replace`

---

### `DEFAULT_ENV_PREFIXES`

```ts
['MIRTA_', 'APP_']
```
Список префиксов по умолчанию для фильтрации переменных.
Можно переопределить через `options.prefix`.

## 🔐 Работа с зашифрованными переменными

`@mirta/env-loader` использует `@dotenvx/dotenvx` для загрузки и расшифровки `.env`-файлов.

Если переменная `DOTENV_KEY` установлена, а файл `.env` зашифрован —
он будет **автоматически расшифрован до загрузки**.

🔍 Это означает:
- `@dotenvx/dotenvx` отвечает за криптографические процессы,
- `@mirta/env-loader` получает уже расшифрованные значения.

Мы не обрабатываем шифрование напрямую.

👉 Подробнее о настройке шифрования см. [dotenvx](https://github.com/dotenvx/dotenvx#readme)

## ✅ Тестирование

Пакет покрыт юнит-тестами (Vitest):

- Загрузка `.env`-файлов в правильном порядке
- Фильтрация по префиксам
- Поддержка `rootDir`
- Интеграция с `DOTENV_KEY` (через моки)
- Кроссплатформенность

## ⚠️ Ограничения

**Работает только в Node.js** (не в Duktape).<br/>
