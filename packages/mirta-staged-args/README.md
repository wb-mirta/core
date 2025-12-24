# @mirta/staged-args

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-staged-args/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-staged-args/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/staged-args?style=flat-square)](https://npmjs.com/package/@mirta/staged-args)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/staged-args?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/staged-args)

> A staged command-line argument parser for building complex, multi-level CLI tools with support for global flags, safe error handling, and smart suggestions.

`@mirta/staged-args` is a **minimal, type-safe utility** built on `parseArgs` from `node:util` that enables parsing command-line arguments in multiple stages. It's ideal for frameworks, generators, and orchestrators that require:
- Processing global flags first (e.g. `--config`, `--verbose`),
- Then parsing command-specific options,
- Without aborting execution on input errors,
- And supporting localized error messages.

The `@mirta/staged-args` package is intended **exclusively for Node.js tools** (≥ 20.6.0) and is not used in Duktape runtime.

## 📦 Installation

```sh
pnpm add @mirta-staged-args
```

## 🚀 Quick Start

Create a parser instance with command-line arguments:

```ts
import { createStagedArgs } from '@mirta/staged-args'

const staged = createStagedArgs(process.argv.slice(2))
```

Define an option schema:

```ts
const schema = {
  config: { type: 'string', default: 'mirta.json' },
  verbose: { type: 'boolean' },
} as const
```

Perform staged parsing:

```ts
const result = staged.parse(schema)

if (result.hasErrors) {
  // Handle errors
  result.errors.forEach(error => {
    console.error(`Error: ${error.type}, option: ${error.option}`)
  })
  process.exit(1)
}

const { data: globals } = result
console.log('Global flags:', globals)
```

Positional arguments (e.g. command and its parameters) are available via `positionals`:

```ts
const { positionals } = result.data
// → ['deploy', 'staging']
```

> ⚠️ **Unknown options** (e.g. `--force`) **do not become positional** — they remain as options and can be caught as `unknown-option` errors when using `parseFinal`.

To continue parsing, use `stagedArgs`:

```ts
const { stagedArgs } = result.data
const commandResult = stagedArgs.parseFinal(commandSchema)
```

## 🔍 Architecture

### Staged Parsing

`@mirta/staged-args` enables:
- Splitting argument parsing into multiple stages.
- First processing configuration-affecting flags.
- Then parsing command-specific options based on loaded configuration.

This is critical for tools like `@mirta/cli`, `create-mirta`, or `nx`, where `--config` must be processed **before** command selection.

> ⚠️ The parser tracks **which positional arguments have already been used as option values** (e.g. `--port 3000`) and marks their indices to prevent reuse.  
> However, **the options themselves (e.g. `--port`) are not "consumed"** — they can be processed again in later stages if included in the schema.  
> This ensures that a value like `deploy` won’t be mistakenly used as a value for `--port` in a subsequent stage.

### Safe Result: `Result<T, E>`

The `parse` and `parseFinal` methods return:

```ts
type Result<TData, TError>
  = | { hasErrors: false, data: TData }
    | { hasErrors: true, errors: TError[] }
```

➡️ Until you check `hasErrors`, the `data` field is **inaccessible in the type system**.  
➡️ This **enforces explicit error handling** and prevents misuse of invalid data.

#### Why this matters

```ts
if (result.hasErrors) {
  // ❌ TypeScript won't allow access to result.data
  console.log(result.data.values) // → Compile-time error
}

// ✅ Only after checking
if (!result.hasErrors) {
  console.log(result.data.values)        // → OK
  console.log(result.data.positionals)   // → OK
  console.log(result.data.stagedArgs)    // → OK — safe to continue
}
```

This approach:
- Ensures you don’t use parsing data when errors are present.
- Makes `stagedArgs` available **only on successful parsing**.
- Works seamlessly with localization systems like `@mirta/i18n`.

### Flexible Suggestions: `suggest?: SuggestFunc`

You can provide a suggestion function:

```ts
const args = createStagedArgs(process.argv.slice(2), {
  suggest: (unknown, known) => {
    return known.includes('config') ? 'config' : undefined
  }
})
```

Or use `suggestClosest` from `@mirta/basics/fuzzy`:

```ts
import { suggestClosest } from '@mirta/basics/fuzzy'

const staged = createStagedArgs(process.argv.slice(2), {
  suggest: suggestClosest,
})
```

This is **not a required dependency** — you choose the strategy.

### Runtime vs Development Errors

- `ParseError` — returned in `Result`:
  ```ts
  { type: 'unknown-option', option: '--confog', suggestion: 'config' }
  ```
  Localizable, does not terminate execution.

- `SchemaError` — thrown as exception:
  For example, on duplicate option names.
  This is a **development-time error**, not exposed to end users.

## 🧰 API

### `createStagedArgs(args: string[], options?: { suggest?: SuggestFunc }): StagedArgs`

Creates a parser instance.

#### Parameters:
- `args` — array of strings (typically `process.argv.slice(2)`).
- `options.suggest` — function returning a suggested correction for an unknown option.

#### Returns:
An object with `parse` and `parseFinal` methods.

---

### `parse<TSchema>(schema: TSchema): Result<ParsedArgs<TSchema>, ParseError>`

Parses arguments according to the schema.

#### Returns:
`Result<ParsedArgs<TSchema>, ParseError>` where `data` includes:
- `values` — parsed option values,
- `positionals` — unprocessed positional arguments,
- `stagedArgs` — a new parsing stage including the current schema (can continue parsing).

> ✅ Use `parse` for **multi-stage** parsing.

---

### `parseFinal<TSchema>(schema: TSchema): Result<ParsedArgsFinal<TSchema>, ParseError>`

Similar to `parse`, but considered a **final stage**:
- Checks for unknown options → `unknown-option` error.
- Does not return `stagedArgs` — further parsing is not possible.

#### Returns:
`Result<ParsedArgsFinal<TSchema>, ParseError>` where `data` includes:
- `values` — parsed values,
- `positionals` — positional arguments.

> ⚠️ Use `parseFinal` for commands or final validation.

---

### `type ParseError`

Supported error types:

```ts
| { type: 'unknown-option', option: string, suggestion?: string }
| { type: 'missing-value', option: string }
```

## ✅ Example: Multi-Stage CLI

```ts
const staged = createStagedArgs(process.argv.slice(2), { suggest: suggestClosest })

// Stage 1: global flags
const globalSchema = { config: { type: 'string' }, verbose: { type: 'boolean' } } as const
const globalResult = staged.parse(globalSchema)

if (globalResult.hasErrors) {
  // Show localized messages
  logErrors(globalResult.errors)
  process.exit(1)
}

// ✅ data is available — no errors
const { positionals, stagedArgs } = globalResult.data

// Load config based on --config
const config = loadConfig(globalResult.data.values.config)

// Stage 2: command and its positional params
const command = positionals[0]
if (!command) {
  console.error('Command not specified')
  process.exit(1)
}

const commandSchema = config.commands[command]
if (!commandSchema) {
  console.error(`Unknown command: ${command}`)
  process.exit(1)
}

// Continue parsing: options like --verbose remain available
const commandResult = stagedArgs.parseFinal(commandSchema)

if (commandResult.hasErrors) {
  logErrors(commandResult.errors)
  process.exit(1)
}

// Execute
run(command, globalResult.data.values, commandResult.data.values)
```

## 🛠 Internal Architecture

- **Modular**: each component is a separate file.
- **No dependencies**: only `node:util`.
- **ESM-first**: supports `#src/*` via `imports`.
- **TypeScript**: full typing, including `Values<TSchema>` inference.
