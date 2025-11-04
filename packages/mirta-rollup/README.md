# @mirta/rollup

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-rollup/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/rollup?style=flat-square)](https://npmjs.com/package/@mirta/rollup)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/rollup?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/rollup)

> Preconfigured build setups with zero-config support and customization,  
> plus public APIs for loading .env files and resolving project structure with workspace support in monorepos.

`@mirta/rollup` is the **primary build tool** for the Mirta-based ecosystem.  
It provides ready-to-use solutions for:
- Building projects and packages: both zero-config and customizable;
- Loading and filtering environment variables from `.env` files;
- Resolving project structure: detecting monorepos via `workspaces`, building a package list.

These tools are used by both the Mirta framework and user projects — ensuring consistency and reliability.

## 🧩 Build Modes

### 1. `@mirta/rollup/config` — Controller Build

For automation projects based on [wb-rules](https://github.com/wirenboard/wb-rules), running on Wiren Board controllers.

#### Usage

```sh
## Installation
pnpm add -D @mirta/rollup

# Build without rollup.config.mjs
rollup -c node:@mirta/rollup/config

```

#### Features

- Input: `src/wb-rules/*.[jt]s`
- Format: `cjs`
- Compatibility: `Babel` + `@mirta/polyfills`
- Automatic `require()` handling via internal plugin `wb-rules-imports`
- Environment variables:
  - Loaded from `.env*` files
  - Filtered by prefixes: `MIRTA_`, `APP_`
- Works in monorepos — correctly embeds packages into the output

✅ Used in create-mirta when generating projects.

### 2. `@mirta/rollup/config-package` — NPM Package Build

For projects distributed via NPM as modular components of the Mirta ecosystem.

#### Usage

```sh
# Without rollup.config.mjs
rollup -c node:@mirta/rollup/config-package

# For CLI tools without exports
rollup -c node:@mirta/rollup/config-package --config-skip-exports

```

#### Features

- Input: `src/index.ts`
- Format: `es` → `.mjs`
- Validation:
  - Enforces alignment between `src/` and `package.json#exports`
  - Fails if there are unmatched files
- Typings:
  - Generates `.d.mts` via `rollup-plugin-dts`
  - Fixes aliases (`#src/*`) via `dtsAlias`
  - Works in monorepos — correctly isolates external dependencies

✅ Used to build the framework's own packages.<br/> ✅ Will be used in `create-mirta` for the "distributable module" template.

## 🛠 Configuration Factories (for customization)

For full control, use direct functions:

```ts
import { defineConfig, definePackageConfig } from '@mirta/rollup'

// For controller projects
export default defineConfig({
  cwd: process.cwd(),
  external: [/^lodash/],
  envLoader: {
    prefix: 'APP_',
  },
})

// For packages
export default definePackageConfig({
  cwd: process.cwd(),
  input: 'src/main.ts',
  external: ['some-legacy-dep'],
})

```
#### Advantages
- Follows the framework's build standards
- Allows extending default behavior
- Ideal for complex projects

## 🧰 Public Infrastructure APIs

### `@mirta/rollup/context` – Context API

Resolves project context:

- Automatically detects project type — standalone or monorepo
- Finds project root via lockfiles (`pnpm`, `yarn`, `bun`, `npm`)
- Detects the package manager in use
- Builds a list of all packages: `{ name, workspacePath }`
- Sorts by nesting depth — to accurately determine which package owns a code chunk

[👉 context source code](https://github.com/wb-mirta/core/tree/latest/packages/mirta-rollup/src/utils/context)

#### Example usage

```ts
// Detect a standalone project
import { resolveWorkspaceContextAsync } from '@mirta/rollup/context'

// Detect a monorepo and build package list
import { resolveMonorepoContextAsync } from '@mirta/rollup/context'

```

Used in Rollup and Vitest configurations.

### `@mirta/rollup/env-loader` – `.env` File Loader API

Loads and filters environment variables from `.env` files. Built on `dotenvx`, supports encryption.

[👉 env-loader source code](https://github.com/wb-mirta/core/tree/latest/packages/mirta-rollup/src/utils/env-loader.ts)

#### Example usage

```ts
import { loadEnv, loadEnvReplacements } from '@mirta/rollup/env-loader'

const mode = process.env.NODE_ENV

// For use in Vitest
const env = loadEnv({ mode, ...envLoaderOptions })

// For use in Rollup
const envReplacements = loadEnvReplacements({ mode, ...envLoaderOptions })

```

Environment files are loaded in the following priority:

- `.env.{mode}.local`
- `.env.{mode}`
- `.env.local`
- `.env`

Searches first in the current project directory, then in the monorepo root (if detected).

- Values from `cwd` override those from the `root` — enabling local configuration overrides
- Filters variables by prefix — defaults: `MIRTA_` and `APP_`
- Only `MIRTA_*` and `APP_*` are exposed to `process.env`
- Prevents accidental leakage of `SECRET_*`, `DATABASE_URL`, etc.
- Allows custom prefixes via `options.prefix`

✅ Used with `@rollup/plugin-replace` via `loadEnvReplacements`, and in Vitest via `loadEnv`.

## 🔄 Architectural Role
The package ensures consistency and predictability across all levels:

- Development tools, such as create-mirta and @mirta/cli, are themselves built using @mirta/rollup/config-package.
- Generated projects use @mirta/rollup/config — ensuring a unified standard for wb-rules.
- The Mirta framework is built the same way — no exceptions.

This creates a **closed trust chain**: the tool that generates a project has itself gone through the same process as its output.
