# `@mirta/env-loader`

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-env-loader/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-env-loader/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/env-loader?style=flat-square)](https://npmjs.com/package/@mirta/env-loader)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/env-loader?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/env-loader)

> Internal environment variable loader based on `@dotenvx/dotenvx`, used by Mirta tools.

`@mirta/env-loader` provides a unified way to load and filter environment variables within the Mirta framework.

Supports:
- `.env` files with modes (`development`, `test`, `production`) and `.local` variants
- Environment variables from the OS and CLI overrides
- Prefix-based filtering (`MIRTA_`, `APP_`)
- `.env` file encryption via `@dotenvx/dotenvx`

Used in `@mirta/rollup`, `@mirta/testing`, and other internal tools.

**Not intended for execution in the Duktape environment on Wiren Board controllers.**

---

## 📦 Installation

```bash
# Not required directly — used internally by Mirta
pnpm add -D @mirta/env-loader
```

⚠️ This package is part of Mirta's internal infrastructure. It is usually not used directly.

## 🚀 Quick Start

```ts
import { loadEnv } from '@mirta/env-loader'

// Load environment variables
const env = loadEnv({ mode: 'development' })

// For code replacement (e.g., with @rollup/plugin-replace)
const replacements = loadEnvReplacements({ mode: 'production' })
```

## 🧰 API

### `loadEnv(options?: EnvLoaderOptions): Record<string, string>`

Synchronously loads and filters environment variables.

#### Parameters

| Field | Type | Description |
|------|-----|----------|
| `mode` | `string` | Environment mode. Defaults to `process.env.NODE_ENV` |
| `prefix` | `string \| string[]` | Prefixes for filtering. Default: `['MIRTA_', 'APP_']` |
| `cwd` | `string` | Current working directory. Defaults to `process.cwd()` |
| `rootDir` | `string` | Root directory of the project (e.g., in a monorepo).<br/>If specified and differs from `cwd`, files are also searched in the root |
| `envFile` | `string \| string[]` | Base `.env` file name. Default: `.env` |
| `keepNodeEnv` | `boolean` | Whether to include NODE_ENV. Default: `true` |
| `dotenv` | `DotenvOptions` | Additional `@dotenvx/dotenvx` options |

### File Loading Order

Files are processed in descending order of priority:

1. **First — all `.env` files in `cwd`** (current directory):
   - `.env.${mode}.local`
   - `.env.${mode}`
   - `.env.local`
   - `.env`
2. **Then — all `.env` files in `rootDir`** (project root), in the same order.

#### ⚠️ Local package settings take precedence over root ones

For example:
- A project is built in `development` mode,
- The package file `packages/my-app/.env` contains `PORT=3000`
- The project's root file `.env.development` contains `PORT=4000`

In this case, `PORT=3000` will be used,<br/>
because the local context is considered more specific.

#### ⚠️ Behavior on key collision depends on `dotenv.overload`

- `dotenv.overload`: `false` (default)

  Variables from earlier files are not overwritten by later ones.<br/>
  → The earlier a file appears in the list, the higher its priority.

- `dotenv.overload`: `true`

  Later files overwrite earlier ones.<br/>
  → The later a file appears in the list, the higher its priority.

By default, `overload`: `false` is used, so .env.${mode}.local has the highest priority.

---

### `loadEnvReplacements(options?: EnvLoaderOptions): Record<string, string>`

Returns an object like:

```ts
{
  'process.env.APP_PORT': '"3000"',
  'import.meta.env.APP_PORT': '"3000"'
}
```

Suitable for integration with `@rollup/plugin-replace`.

---

### DEFAULT_ENV_PREFIXES

```ts
['MIRTA_', 'APP_']
```

Default list of prefixes for variable filtering.
Can be overridden via `options.prefix`.

## 🔐 Working with encrypted variables

`@mirta/env-loader` uses `@dotenvx/dotenvx` to load and decrypt `.env` files.

If the `DOTENV_KEY` environment variable is set and the `.env` file is encrypted,
it will be automatically decrypted before loading.

🔍 This means:
- `@dotenvx/dotenvx` handles cryptographic operations,
- `@mirta/env-loader` receives already decrypted values.

We do not process encryption directly.

👉 For setup details, see [dotenvx](https://github.com/dotenvx/dotenvx#readme)

## ✅ Testing

The package is covered with unit tests (Vitest):
- Loading `.env` files in the correct order
- Prefix filtering
- `rootDir` support
- Integration with `DOTENV_KEY` (via mocks)
- Cross-platform compatibility

## ⚠️ Limitations

**Works only in Node.js** (not in Duktape).
