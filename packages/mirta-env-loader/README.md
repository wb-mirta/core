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
import { loadEnv, loadEnvReplacements } from '@mirta/env-loader'

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
 | `keepNodeEnv` | `boolean` | Whether to include `NODE_ENV`. Default: `true`.<br/>If `false`, it is removed from the returned object.<br/>⚠️ Note: does not affect the global `process.env.NODE_ENV` value |
 | `dotenv` | `DotenvOptions` | Additional `@dotenvx/dotenvx` settings, see below |

#### ⚠️ **Security: `prefix` cannot be fully disabled**

The `prefix` option **cannot be disabled** (e.g., via `prefix: false`, `prefix: ''`, `prefix: []`, or `prefix: ['']`) to prevent **automatic secret leakage**.

Even when loading variables, filtering remains active, and default prefixes (`MIRTA_`, `APP_`) are applied.

If you need to load variables with other prefixes, explicitly specify them:

```ts
loadEnv({
  prefix: ['MIRTA_', 'APP_', 'CUSTOM_', 'SECRET_'] // ← explicit allowance
})
```
This ensures that **only expected variables** are included in the result and — when using `loadEnvReplacements` — in the client-side code.

#### ⚙️ Dotenv Options

Type: `DotenvOptions` — passed directly to `@dotenvx/dotenvx`, but with limitations.

`@mirta/env-loader` controls key aspects of loading, so some options are overridden or ignored to ensure predictable behavior.

✅ **Supported and safe options**

| Option | Description |
|--------|-------------|
| `overload` | If `true`, later files overwrite variables from earlier ones. Default: `false` (earlier files have higher priority) |
| `encoding` | Encoding of `.env` files. Default: `'utf8'` |
| `strict` | If `true`, throws an error on parsing failures. Default: `false` |
| `debug` | Enables debug output. Useful for diagnostics. Default: `false` |
| `verbose` | Increases log verbosity |
| `quiet` | Suppresses console output (including errors) |
| `envKeysFile` | Path to `.env.keys` — useful in monorepos |
| `logLevel` | Log level: `'error'`, `'warn'`, `'info'`, etc. Partially overridden — see below |

❌ **Ignored or overridden options**

| Option | What happens | Reason |
|--------|--------------|--------|
| `path` | Ignored | File order and list are determined by `@mirta/env-loader` |
| `processEnv` | Overridden | To avoid polluting `process.env` and to apply filtering |
| `convention` | Ignored | To prevent conflicts with built-in priority logic |
| `logLevel` | Default is `'warn'`, but can be overridden | To avoid suppressing important warnings (e.g., missing `.env.keys`) |
| `ignore` | `'MISSING_ENV_FILE'` is enforced | `.env` files are optional — missing files are not an error |

📌 **Recommendations**
- Use `overload`, `debug`, `encoding` — they work as expected.
- Do not rely on `convention` or `path` — they are disabled.
- To change load order, configure `envFile`, `mode`, and `.env` file structure.

Example

```ts
const env = loadEnv({
  mode: 'production',
  dotenv: {
    overload: true,     // ✅ allowed: reverses file processing priority
    debug: true,        // ✅ allowed: console output
    encoding: 'utf16',  // ✅ rare, but possible
    // convention: 'nextjs'  // ❌ ignored
  }
})
```

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

## 🛡️ Security and Configuration Best Practices

### ❌ Do not use system environment variables directly

Directly loading system environment variables — such as `PATH`, `HOME`, `USER`, `NODE_VERSION` — is **not recommended**, even if they are available in the environment.

👉 Why:
- **Breaks portability**: behavior will differ across machines.
- **Security risk**: sensitive data may accidentally leak into the build.
- **Non-deterministic behavior**: application behavior depends on the environment, not configuration.

---

### ✅ Option 1: Explicit override in `.env`

If you truly need a system environment variable, **explicitly declare it in your `.env` file**:

```env
# .env
MIRTA_PATH=${PATH}
MIRTA_HOME=${HOME}
APP_NODE_VERSION=${NODE_VERSION}
```
👉 This way:
- You **control** which variables enter the application,
- You **document** the intent explicitly,
- You can **override** the value per environment.

⚠️ Important: `@mirta/env-loader` does not expose variables outside allowed prefixes — even if `${PATH}` is used in `.env`, the `PATH` variable itself will not be included unless it starts with `MIRTA_` or `APP_`.

---

### ✅ Option 2: Explicit configuration (recommended)

Better yet — **avoid relying on system variables altogether**, and define paths and settings explicitly:

```env
# .env
MIRTA_BINARY_PATH=/usr/local/bin/custom-tool
APP_CONFIG_DIR=/etc/myapp
APP_CACHE_DIR=./temp/cache
```
👉 Benefits:

**Portability**: the app behaves consistently across environments,
**Readability**: all settings are visible in `.env`,
**Security**: no surprises from the environment,
**Testability**: easy to emulate different setups.

---

🧩 Example of a secure .env

```env
# Environment mode
NODE_ENV=development

# Binaries and paths
MIRTA_BINARY_PATH=/opt/tools/cli
MIRTA_CONFIG_ROOT=./config

# Application settings
APP_PORT=3000
APP_API_KEY=dev-key-7x29qn
APP_FEATURE_TOGGLES=auth,logging,metrics

# Logging
MIRTA_LOG_LEVEL=debug
```

---

📌 Summary
- ❌ **Do not rely** on system environment variables directly.
- ✅ **Explicitly** declare everything you need in .env.
- ✅ **Use clear, fixed values**.

This way, you build a **predictable, secure, and portable** application.

## 🔐 Working with Encrypted Variables

`@mirta/env-loader` uses `@dotenvx/dotenvx` to load and decrypt `.env` files.

> ⚠️ **Deprecated: `DOTENV_KEY` and `.env.vault`**
>
> The legacy encryption flow using `DOTENV_KEY` and `.env.vault` is **deprecated**.  
> While still supported for backward compatibility, it is no longer recommended.


✅ **Current mechanism: Key-pair encryption**

`dotenvx` now uses public-key cryptography:
- **`DOTENV_PUBLIC_KEY`** — used to **encrypt** `.env` files.
- **`DOTENV_PRIVATE_KEY`** — used to **decrypt** them at runtime.

When enabled:
- Your `.env` files are **fully encrypted on disk**.
- Only the public key is needed for encryption (safe to commit).
- The private key is required for decryption (kept secret in CI/CD or local env).

🔍 How it works:
- `@dotenvx/dotenvx` performs all cryptographic operations using the key pair.
- `@mirta/env-loader` receives **already decrypted values** — it does not handle keys or crypto directly.

👉 We recommend migrating to the new key-pair system.
 
For setup, see: [dotenvx — Encryption Guide](https://github.com/dotenvx/dotenvx#encryption)

## ✅ Testing

The package is covered with unit tests (Vitest):
- Loading `.env` files in the correct order
- Prefix filtering
- `rootDir` support
- Integration with `DOTENV_KEY` (via mocks)
- Cross-platform compatibility

## ⚠️ Limitations

**Works only in Node.js** (not in Duktape).
