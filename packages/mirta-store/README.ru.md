# @mirta/store

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-store/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-store/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/store?style=flat-square)](https://npmjs.com/package/@mirta/store)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/store?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/store)

> Типизированное хранилище состояний для сценариев автоматизации, вдохновлённое архитектурой Pinia.

Каждый скрипт в папке `wb-rules` выполняется в изолированном контексте — с отдельным пространством имён. Это означает, что функции и переменные одного скрипта недоступны другим.

`@mirta/store` позволяет выносить данные в **централизованные состояния**, доступные из любых скриптов и модулей. Предоставляет удобный API для:
- определения структуры состояния,
- типизированного доступа,
- реактивного обновления,
- изоляции экземпляров.

Работает на контроллерах Wiren Board, поддерживает TypeScript и совместим с `wb-rules`.

## 📦 Установка

```sh
pnpm add @mirta/store
```

✅ Пакет проходит сборку конфигурацией из пакета `@mirta/rollup` и при вызове в коде автоматически встраивается как модуль `wb-rules-modules`.

## 🚀 Быстрый старт

### 1. Задайте структуру хранилища

Используйте `defineStore` для описания структуры. Делайте это **один раз**, лучше в модуле.

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

### 2. Используйте в скриптах и модулях

Подключите хранилище в любом скрипте `wb-rules` или модуле `wb-rules-modules` — состояние будет общим.

```ts
// src/wb-rules/01-init.ts
import { useCounter } from '#wbm/counter'

const store = useCounter()
log(`Счётчик: ${store.count}`) // 0

store.increment()
```
Изменения в одном скрипте мгновенно доступны в другом.

## 📚 API

### `defineStore(typeId, options)`

Создаёт определение хранилища.
- **`typeId: string`** — идентификатор типа хранилища (должен быть уникальным),
- **`options: DefineStoreOptions`** — конфигурация: `state`, `getters`, `actions`.

> ❗ Повторный вызов с тем же `typeId` вызывает ошибку `StoreError` — определение уникально.

Возвращает функцию `useStore()`.

---

### `useStore(scope?)`

Возвращает экземпляр хранилища.

- **`scope?: string`** — опциональный идентификатор контекста (например, `'kitchen'`).

Если `scope` указан, `storeId = "${typeId}/${scope}"`.  
Если нет — используется общий `storeId = typeId`.

#### Свойства экземпляра

| Свойство | Тип | Описание |
|--------|-----|----------|
| `$id` | `string` | Уникальный идентификатор экземпляра |
| `$state` | `TState` | Ссылка на состояние |
| `$patch` | `(patch: Partial<TState>) => void`<br/>`(mutator: (state: TState) => void) => void` | Обновляет состояние |
| `$reset` | `() => void` | Сбрасывает состояние к начальному |

---

### `StoreError`

Специализированный класс ошибок с кодами:

- `'alreadyDefined'` — повторное определение,
- `'alreadyDefinedOutside'` — повторное определение в другом файле,
- `'readonlyProperty'` — изменение служебного поля,
- `'unknownProperty'` — обращение к неизвестному полю.

## 🔧 Особенности

### ✅ Полная типобезопасность

Автодополнение, проверка типов, поддержка `this` в геттерах и действиях.

<details>
<summary>Подробнее</summary>

```ts
getters: {
  double: (state) => state.count * 2,
  doublePlusOne(): number { // ← явный тип обязателен
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

> ⚠️ Геттеры, использующие `this`, **должны иметь явный возвращаемый тип**.
</details>

### 📦 Глубокое обновление через `$patch`

Обновляйте вложенные объекты безопасно — `@mirta/store` выполняет **глубокое слияние**.

<details>
<summary>Подробнее</summary>

Поддерживается два способа:

```ts
store.$patch({ count: 10, config: { debug: true } })
store.$patch((state) => {
  state.tags.push('new')
})
```
> Использует `deepMerge`: объекты сливаются, массивы перезаписываются.
</details>

### 🔁 Сброс состояния через `$reset`

Верните хранилище к начальному состоянию — как при первом создании.

<details>
<summary>Подробнее</summary>

```ts
store.$reset()
```
- Вызывает `state()`
- Сохраняет реактивность
- Удаляет значения состояния для тестов, перезапуска логики, сброса настроек

</details>

### 🛑 Защита от дублирования

Хранилище нельзя определить дважды с одним `typeId` — это предотвращает конфликты.

<details>
<summary>Подробнее</summary>

```ts
defineStore('sensor', { ... }) // ✅
defineStore('sensor', { ... }) // ❌ StoreError: alreadyDefined
```
> Проверка работает всегда — в `development` и `production`.  
> Гарантирует, что только один модуль может контролировать тип хранилища.

</details>

### 🧩 Scoped States — изолированные экземпляры

Создавайте отдельные экземпляры хранилища для разных контекстов: комнат, устройств, сессий.

<details>
<summary>Подробнее</summary>

```ts
const useSensor = defineStore('sensor', { ... })

const kitchen = useSensor('kitchen')
const bathroom = useSensor('bathroom')
```

Каждый экземпляр имеет `storeId = "sensor/kitchen"` — состояние изолировано.

> Полезно при управлении множеством однотипных сущностей.

</details>

### 🔐 Internal Store — инкапсуляция состояния

Сделайте хранилище недоступным извне, не экспортируя `useStore()`.

<details>
<summary>Подробнее</summary>

Если `useStore()` не экспортирован:
- внешние модули не могут получить доступ к состоянию,
- повторное определение с тем же `typeId` запрещено,
- состояние становится **внутренней деталью реализации**.

> Полезно в NPM-пакетах, где нужно скрыть реализацию.
> 
> ❗ Не имеет смысла в локальных модулях, где `defineStore()` и `useStore()` в одном файле.

</details>

### 💾 Сериализация состояния
Для сохранения или передачи состояния используйте **`$state`**.

<details>
<summary>Подробнее</summary>

```ts
const store = useCounter()

// ✅ Правильно — сериализует только состояние
const json = JSON.stringify(store.$state)

// ❌ Неправильно — содержит функции и служебные поля
const json = JSON.stringify(store)
```

Свойство `$state` содержит чистый объект состояния без методов и прокси-данных.

</details>

## 🔄 Когда что использовать

### 1. Временное состояние: `@mirta/store` vs `global.__proto__`

| Характеристика | `@mirta/store` | `global.__proto__` |
|----------------|----------------|--------------------|
| Инкапсуляция | ✔️ | ❌ |
| Типизация | ✔️ | ❌ |
| API (`$patch`, `$reset`) | ✔️ | ❌ |
| Изоляция экземпляров | ✔️ `useStore('kitchen')` | ❌ |
| Читаемость | ✔️ | ❌ |
| Производительность | ✔️ Минимальный оверхед | ✔️ Прямой доступ |

> ❌ `global.__proto__` — **антипаттерн**. Не используйте.

---

### 2. Временное vs постоянное хранение

| Характеристика | `@mirta/store` | `PersistentStorage` |
|----------------|----------------|---------------------|
| Хранение | RAM | Flash / FS |
| После перезагрузки | ❌ | ✔️ |
| Типизация | ✔️ | ❌ |
| Скорость | Высокая | Ниже (IO) |
| API | `$patch`, `$reset` | `get`, `set`, `remove` |

> ✅ Используйте совместно:  
> - `@mirta/store` — для текущего состояния,  
> - `PersistentStorage` — для сохранения и восстановления.

## 🧪 Тестирование

Пакет полностью покрыт модульными тестами с использованием `@mirta/testing` и `vitest`.  
Тесты проверяют:
- Создание и использование хранилищ
- Работу `$patch`, `$reset`
- Поддержку изолированных экземпляров
- Защиту от дублирования

## ⚠️ Ограничения

- Состояние **теряется** при перезагрузке сервиса `wb-rules.service` или контроллера.
- Экземпляры хранилищ кэшируются глобально и **не удаляются автоматически**. При динамическом создании большого количества экземпляров с уникальными `scope` может возникнуть утечка памяти. Рекомендуется использовать предсказуемые, ограниченные значения `scope`.
