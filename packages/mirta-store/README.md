# @mirta/store

[![en](https://img.shields.io/badge/lang-en-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-store/README.md)
[![ru](https://img.shields.io/badge/lang-ru-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-store/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/store?style=flat-square)](https://npmjs.com/package/@mirta/store)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/store?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/store)

> Type-safe storage solution for automation scenarios, inspired by the Pinia architecture.

Each script in the `wb-rules` folder runs in an isolated context — with a separate namespace. This means that functions and variables from one script are not accessible to others.

`@mirta/store` enables moving data into **centralized states**, available across any scripts and modules. Provides a convenient API for:
- defining state structure,
- type-safe access,
- reactive updates,
- instance isolation.

Works on Wiren Board controllers, supports TypeScript, and is compatible with `wb-rules`.

## 📦 Installation

```sh
pnpm add @mirta/store
```

✅ The package is processed by the configuration from `@mirta/rollup` and automatically embedded as a `wb-rules-modules` module when used in code.

## 🚀 Quick Start

### 1. Define the store structure

Use `defineStore` to describe the structure. Do this **once**, preferably in a module.

```ts
// src/wb-rules-modules/counter.ts
import { defineStore } from '@mirta/store'

export const useCounter = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
    setCount(value: number) {
      this.count = value
    },
  },
})
```

### 2. Use in scripts and modules

Import the store in any `wb-rules` script or `wb-rules-modules` module — the state will be shared.

```ts
// src/wb-rules/01-init.ts
import { useCounter } from '#wbm/counter'

const store = useCounter()
log(`Counter: ${store.count}`) // 0

store.increment()
```

Changes in one script are instantly available in another.

## 📚 API

### `defineStore(typeId, options)`

Creates a store definition.
- **`typeId: string`** — store type identifier (must be unique),
- **`options: DefineStoreOptions`** — configuration: `state`, `getters`, `actions`.

> ❗ Repeated calls with the same `typeId` throw a `StoreError` — definitions are unique.

Returns the `useStore()` function.

---

### `useStore(scope?)`

Returns a store instance.

- **`scope?: string`** — optional context identifier (e.g., `'kitchen'`).

If `scope` is provided, `storeId = "${typeId}/${scope}"`.  
Otherwise, the general `storeId = typeId` is used.

#### Instance properties

| Property | Type | Description |
|--------|-----|----------|
| `$id` | `string` | Unique instance identifier |
| `$state` | `TState` | Reference to the state |
| `$patch` | `(patch: Partial<TState>) => void`<br/>`(mutator: (state: TState) => void) => void` | Updates the state |
| `$reset` | `() => void` | Resets the state to initial |

---

### `StoreError`

A specialized error class with the following codes:

- `'alreadyDefined'` — repeated definition,
- `'alreadyDefinedOutside'` — repeated definition in another file,
- `'readonlyAssignment'` — attempting to modify a readonly property.

## 🔧 Features

### ✅ Full type safety
Autocompletion, type checking, and support for `this` in getters and actions.

<details>
<summary>Details</summary>

```ts
getters: {
  double: (state) => state.count * 2,
  doublePlusOne(): number { // ← explicit return type required
    return this.double + 1
  }
},
actions: {
  increment() {
    this.count++
    this.$patch({ count: 5 })
  }
}
```

> ⚠️ Getters using `this` **must have an explicit return type**.
</details>

---

### 📦 Deep updates with `$patch`
Safely update nested objects — `@mirta/store` performs **deep merging**.

<details>
<summary>Details</summary>

Two update methods are supported:

```ts
store.$patch({ count: 10, config: { debug: true } })
store.$patch((state) => {
  state.tags.push('new')
})
```

> Uses `deepMerge`: objects are merged, arrays are overwritten.
</details>

---

### 🔁 Reset state with `$reset`
Restore the store to its initial state — as when first created.

<details>
<summary>Details</summary>

```ts
store.$reset()
```

- Calls `state()`
- Preserves reactivity
- Useful for tests, restarting logic, or resetting settings
</details>

---

### 🛑 Protection against duplication
A store cannot be defined twice with the same `typeId` — prevents conflicts.

<details>
<summary>Details</summary>

```ts
defineStore('sensor', { ... }) // ✅
defineStore('sensor', { ... }) // ❌ StoreError: alreadyDefined
```

> Check runs in both `development` and `production`.  
> Ensures only one module controls a store type.
</details>

---

### 🧩 Scoped States — isolated instances
Create separate store instances for different contexts: rooms, devices, sessions.

<details>
<summary>Details</summary>

```ts
const useSensor = defineStore('sensor', { ... })

const kitchen = useSensor('kitchen')
const bathroom = useSensor('bathroom')
```

Each instance has `storeId = "sensor/kitchen"` — state is isolated.

> Useful when managing multiple similar entities.
</details>

---

### 🔐 Internal Store — state encapsulation

Make a store inaccessible from outside by not exporting `useStore()`.

<details>
<summary>Details</summary>

If `useStore()` is not exported:
- external modules cannot access the state,
- redefining with the same `typeId` is prohibited,
- the state becomes an **internal implementation detail**.

> Useful in NPM packages where implementation must be hidden.
> 
> ❗ Not meaningful in local modules where `defineStore()` and `useStore()` are in the same file.
</details>

## 🔄 When to use

### 1. Temporary state: `@mirta/store` vs `global.__proto__`

| Feature | `@mirta/store` | `global.__proto__` |
|--------|----------------|--------------------|
| Encapsulation | ✔️ | ❌ |
| Type safety | ✔️ | ❌ |
| API (`$patch`, `$reset`) | ✔️ | ❌ |
| Instance isolation | ✔️ `useStore('kitchen')` | ❌ |
| Readability | ✔️ | ❌ |
| Performance | ✔️ Minimal overhead | ✔️ Direct access |

> ❌ `global.__proto__` — **an anti-pattern**. Do not use.

---

### 2. Temporary vs persistent storage

| Feature | `@mirta/store` | `PersistentStorage` |
|--------|----------------|---------------------|
| Storage | RAM | Flash / FS |
| Survives reboot | ❌ | ✔️ |
| Type safety | ✔️ | ❌ |
| Speed | High | Slower (IO) |
| API | `$patch`, `$reset` | `get`, `set`, `remove` |

> ✅ Use together:  
> - `@mirta/store` — for current runtime state,  
> - `PersistentStorage` — for saving and restoring.

## 🧪 Testing

The package is fully covered with unit tests using `@mirta/testing` and `vitest`.  
Tests verify:
- Store creation and usage
- `$patch`, `$reset` functionality
- Support for isolated instances
- Protection against duplication

## ⚠️ Limitations

- State is **lost** upon restarting the `wb-rules.service` or the controller.
- Store instances are cached globally and **not automatically cleared**. Dynamically creating a large number of instances with unique `scope` values may lead to memory leaks. Use predictable, bounded `scope` values.
