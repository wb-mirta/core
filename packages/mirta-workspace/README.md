# `@mirta/workspace`

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-workspace/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-workspace/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/workspace?style=flat-square)](https://npmjs.com/package/@mirta/workspace)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/workspace?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/workspace)

> Utility set for analyzing repository structure in projects based on Mirta framework.

`@mirta/workspace` helps tools determine:
- Where is the project root?
- Which package manager is used?
- Which packages are declared in `workspaces`?

Designed for reuse in other packages without heavy dependencies (e.g., from Rollup).<br/>

**Not intended for execution in the Duktape environment on Wiren Board controllers.**

## 📦 Installation

```bash
# Not required directly — used internally by Mirta
pnpm add -D @mirta/workspace
```
⚠️ This package is part of Mirta's internal infrastructure. It is typically not used directly.

## 🚀 Quick Start

```ts
import { resolveMonorepoContextAsync } from '@mirta/workspace'

const context = await resolveMonorepoContextAsync(process.cwd())

console.log(context.rootDir) // /home/user/my-mirta-repo
console.log(context.manager) // 'pnpm'
console.log(context.packages) // [{ name: '@mirta/core', workspacePath: 'packages/core' }, ...]
```
## 🧰 API

`resolveWorkspaceContextAsync(cwd: string): Promise<WorkspaceContext>`<br/>
Asynchronously resolves the workspace context (lightweight variant).

Finds the workspace root by the presence of a lockfile (`pnpm-lock.yaml`, `yarn.lock`, etc.) and reads `package.json`.

Use this function when you only need to identify the workspace root and the package manager in use, without resolving all packages.

Returns:

```ts
interface WorkspaceContext {
  rootDir: string         // Root directory (where lockfile is located)
  manager: PackageManager // 'pnpm' | 'bun' | 'yarn' | 'npm'
  workspaces?: string[]   // Array of glob patterns from the `workspaces` field
}
```
Throws: `WorkspaceError` if:

Lockfile not found (`noLockfile`)
`workspaces` has invalid format (`badWorkspacesFormat`)

---

`resolveMonorepoContextAsync(cwd: string): Promise<MonorepoContext>`<br/>
Asynchronously resolves the full monorepo context.

Based on `WorkspaceContext`, finds all packages declared in workspaces and reads their `package.json` using `@mirta/package`.

Returns:

```ts
interface MonorepoContext {
  rootDir: string
  manager: PackageManager
  packages: readonly PackageDefinition[]
}
```
Packages are returned sorted by path length (longer paths first) to ensure correct matching in the future.

Results are cached by `rootDir` for performance.

---

`toPosix(path: string): string`<br/>
Converts a path to POSIX format (with `/`), even on Windows.

Used to normalize paths before comparison and processing.

## 🧩 Supported Package Managers

Detected by lockfiles:
- `pnpm` → `pnpm-lock.yaml`
- `yarn` → `yarn.lock`
- `npm` → `package-lock.json`
- `bun` → `bun.lock`

## ✅ Testing

The package is fully covered with unit tests:
- Finding root by lockfile
- Handling `workspaces`
- Collecting packages, sorting, caching
- Cross-platform compatibility (Windows/POSIX)

Uses Vitest and mocked dependencies (`find-up`, `glob`, `@mirta/package`).

## ⚠️ Limitations

**Works only in Node.js** (not in Duktape).<br/>
`workspaces` must be an array of strings.
