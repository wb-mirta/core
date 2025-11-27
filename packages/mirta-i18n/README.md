# @mirta/i18n

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-i18n/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-i18n/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/i18n?style=flat-square)](https://npmjs.com/package/@mirta/i18n)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/i18n?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/i18n)

> Localization library for Mirta Framework CLI tools, with ICU-compatible syntax.

The `@mirta/i18n` package is intended exclusively for **Node.js tools** (≥ 20.6.0) and is not used in the Duktape runtime.

## Features

- ✔️ Type-safe keys and variables — when a `LocaleShape` is provided
- ✔️ ICU-compatible syntax: `{var}`, `{count, plural, ...}`, `offset`, `=n`, `#`
- ✔️ Asynchronous loading and caching of `.json` files
- ✔️ Zero dependencies — minimal footprint
- ✔️ Configurable fallback (en-US by default)
- ✔️ Unified translation contract `t(key, vars)`

## 📦 Installation

```sh
pnpm add @mirta/i18n
```

⚠️ This package is part of Mirta Framework's internal infrastructure. It is typically not used directly.

## Usage

### 1. Organize the locale structure

Set up the localization structure for your package:

```txt
<package>/
  locales/
    en-US.json
    ru-RU.json
```

Example `en-US.json`:

```json
{
  "title": "Welcome",
  "files.plural": "{count, plural, =0{No files} one{One file} other{# files}}",
  "greeting": "Hello, {name}!"
}
```

### 2. Define the `LocaleShape`

To enable type safety, define an interface compatible with `GenericShape`:

```ts
interface LocaleShape {
  messages: {
    'title': string;
    'files.plural': string;
    'greeting': string;
  };
  variables: {
    'files.plural': { count: number };
    'greeting': { name: string };
  };
}
```

> 💡 The `LocaleShape` type must be defined in the project.  
> Mirta Framework uses an internal script to generate it from `locales/en-US.json`.

> ⚠️ If no locale shape is provided, `GenericShape` is used — keys and variables are not type-checked.

### 3. Initialize localization

In the package to be localized:

```ts
// src/i18n/index.ts
import { initLocalizationAsync } from '@mirta/i18n'

export const { t, setLocaleAsync } = await initLocalizationAsync<LocaleShape>()
```

### 4. Use translation

```ts
console.log(t('title')) // → "Welcome"
console.log(t('greeting', { name: 'Alice' })) // → "Hello, Alice!"
console.log(t('files.plural', { count: 5 })) // → "5 files"
```

Changing locale:

```ts
await setLocaleAsync('ru-RU')
console.log(t('title')) // → "Добро пожаловать"
```

## 📚 API

### `initLocalizationAsync<TShape>(options)`

Initializes the localization subsystem.

#### Parameters

| Field | Type | Description |
|------|-----|----------|
| `cwd` | `string` | Working directory (default: `process.cwd()`) |
| `fallbackLocale` | `string` | Fallback locale (default: `'en-US'`) |

#### Returns

`Promise<Localization<TShape>>`

#### Errors

- `fallback.LoadFailed` — if the fallback locale cannot be loaded.

---

### `Localization<TShape>`

| Method | Type | Description |
|------|-----|----------|
| `t(key, vars?)` | `(key: K, vars?: VariablesOf<TShape, K>) => string` | Type-safe translation function |
| `getLocale()` | `() => Locale` | Returns current locale |
| `setLocaleAsync(locale)` | `(locale: string) => Promise<void>` | Changes locale (normalizes and caches) |

---

### `Locale`

Type: `Branded<string, 'Locale'>` — branded locale type.

### `Lang`

Type: `Branded<string, 'Lang'>` — branded language type.

## Key Features

### ✅ Optional type safety

The `t()` function ensures type safety **only when `LocaleShape` is provided**:

- Validates key existence
- Enforces required variables
- Prevents extra fields

```ts
t('files.plural', { count: 2 }) // ✅
t('files.plural', {})           // ❌ Error: missing `count`
t('title', { name: 'John' })    // ❌ Error: `title` does not accept variables
```

### ✅ ICU-compatible syntax

Supports a **limited subset of ICU MessageFormat**, sufficient for CLI:

- Interpolation: `{name}`, `{user.name}`, `{file-count}` (allowed: `a-z`, `A-Z`, `0-9`, `_`, `.`, `-`)
- Plural: `{count, plural, one{...} few{...} other{...}}`
- Offset: `offset:1`, `=0`, `#`

> ⚠️ Not supported:
> - `select`, `selectordinal`, number/date formatting
> - Variables with spaces: `{first name}` → not replaced
> - Nested `plural` or `#` inside `=n`

> Implemented without external dependencies — only essentials.

#### Example with `offset`

```json
"sockets.active": "{count, plural,
  offset:1
  =0 {Only server is on}
  one {One more socket connected}
  other {# more sockets connected}
}"
```

- `count = 1` → `# = 0` → "Only server is on"
- `count = 2` → `# = 1` → "One more socket connected"
- `count = 5` → `# = 4` → "4 more sockets connected"

Allows excluding persistent elements from the count.

### ✅ Asynchronous initialization and caching

- `initLocalizationAsync` loads and caches both fallback and system locale.
- `setLocaleAsync` caches loaded locales — no redundant reloads.
- Fallback chain: `current → fallback → {{key}}` if translation is missing.

### ✅ Locale normalization

The `setLocaleAsync` function accepts any string, but:
- Automatically normalizes format (e.g. `ru_RU` → `ru-RU`)
- Falls back to `fallbackLocale` on invalid input
- Supports only `en-US` and `ru-RU`

No manual locale validation required.

### ✅ Language support

- `ru`: full support for `one` / `few` / `many` (per [CLDR](https://cldr.unicode.org/))
- `en` and others: `one` (if 1), otherwise `other`

> For languages with special plural forms (e.g. `pl`, `ar`), extend `getPluralForm`.

#### Language-specific behavior

For Russian (`ru-RU`), fractional numbers (e.g. `36.6`) always use the `few` plural form (e.g. `36.6 градуса`), regardless of the integer part.

This follows Russian grammatical rules: in mixed numbers, the fractional part governs the noun, requiring the genitive singular case (e.g. _"одна целая пять десятых градуса"_).

Since ICU does not define a dedicated plural category for fractional numbers, `few` is used as the closest available match.

## When to use?

Use `@mirta/i18n` if:
- Your tool supports multiple languages,
- You need accurate plural forms (especially for Russian),
- Locales are stored in `.json` and loaded asynchronously,
- Small bundle size and zero dependencies are important.

## Limitations

- The `LocaleShape` type must be declared before use.
- Localization instances are cached — avoid creating thousands of dynamic locales.
- No support for `select`, `selectordinal`, number/date formatting.
- Variables with spaces (`{first name}`) are not replaced.
- `#` respects `offset` but does not support formatting.

## Testing

The package is covered with unit tests (`vitest`, `@mirta/testing`) verifying:
- Initialization
- Translation with variables and plural forms
- Locale switching
- Fallback logic
