# `@mirta/package`

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-package/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-package/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/package?style=flat-square)](https://npmjs.com/package/@mirta/package)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/package?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/package)

> A simple and reliable way to read `package.json` in Mirta tools.

`@mirta/package` is a utility for safely reading `package.json` in the development environment. It supports:
- TypeScript typing
- Clear error handling
- Working only with the fields needed by the framework: `name`, `exports`, `workspaces`

Used internally by `@mirta/workspace`, `@mirta/rollup`, and other Mirta tools for analyzing project structure.<br/>

**Not intended for execution in the Duktape environment on Wiren Board controllers.**

## 📦 Installation

```bash
# Not required directly — used internally by Mirta
pnpm add -D @mirta/package
```
⚠️ This package is part of Mirta's internal infrastructure. It is typically not used directly.

## 🚀 Quick Start

```ts
import { readPackage, PackageError } from '@mirta/package'

try {

  const pkg = readPackage('packages/core') // Path to directory or file
  console.log(pkg.name)
  console.log(pkg.exports)

} catch (err) {

  if (err instanceof PackageError)
    console.error('Error:', err.message)

}
```

## 🧰 API

`readPackage(path: string): Package`

Synchronously reads and parses `package.json` from the given path.

Supports:
- Path to file: `'package.json'`, `'packages/core/package.json'`
- Path to package directory: `'.'`, `'packages/core'`

Returns: an object of type `Package`.<br/>
Throws: `PackageError` if the file is not found, inaccessible, or contains invalid JSON.

---

`parsePackageJson(content: string): Package`

Parses a string containing `package.json` content into a `Package` object.

Use if the file content is already loaded (e.g. from cache or test).

---

`PackageError`

Error class with clear messages and codes. Helps quickly identify what went wrong.

Possible error codes:
- `notFound`: the package.json file was not found,
- `accessDenied`: permission denied to read the file,
- `invalidPath`: the path does not point to a package.json file or package directory,
- `invalidJson`: the file contains invalid or malformed JSON,
- `invalidJsonRoot`: the JSON root is not an object,
- `failedToParse`: failed to parse the file content.

Example usage:

```ts
if (err.code === 'notFound') {
  console.error('File not found:', err.message)
}
```
## 🧩 Supported Fields

The package reads only the `package.json` fields required by the framework:

`name`

Package name, e.g.: `"@mirta/basics"`

`exports`

Simplified format with import is supported:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs"
    },
    "./setup-global": "./dist/setup/global.mjs"
  }
}
```
Or with types:

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      }
    }
  }
}
```
Ignored: `require`, `node`, `browser`, and other conditions.

`workspaces`

Only array of strings is allowed: `["packages/*"]`</br>
Object format (`{ packages: [...] }`) is not supported.

## ✅ Testing

The package is fully tested:

- Successful `package.json` reading
- Handling all error types: file not found, no access, invalid JSON
- Support for various paths
- Correct error mapping to `PackageError`
- Uses Vitest, dependency mocks, and isolated tests.

⚠️ Limitations

- Works only in Node.js (not in Duktape).
- Supports only `import` in `exports`.
- The `workspaces` field must be an array of strings.
- Synchronous API — do not use in asynchronous environments without wrapping.

## 🔄 Usage in `@mirta/workspace`

This package is used in `@mirta/workspace` to:
- Read `package.json` of the root project and individual packages.
- Validate the `workspaces` field.
- Collect metadata from every package in the monorepo.

Example:
```ts
const pkg = readPackage(`${rootDir}/packages/core/package.json`)
```
Ensures a consistent and reliable way to access package metadata.