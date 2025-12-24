# @mirta/staged-args

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-staged-args/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-staged-args/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/staged-args?style=flat-square)](https://npmjs.com/package/@mirta/staged-args)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/staged-args?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/staged-args)

> Утилита поэтапного разбора аргументов командной строки. Предназначена для создания сложных, многоуровневых CLI-инструментов с поддержкой глобальных флагов, безопасной обработки ошибок и гибких подсказок.

`@mirta/staged-args` — это **минималистичный, типобезопасный инструмент** на основе `parseArgs` из `node:util` для разбора аргументов в несколько этапов. Подходит для фреймворков, генераторов и оркестраторов, где требуется:
- Сначала обработать глобальные флаги (`--config`, `--verbose`),
- Затем — командные опции,
- При этом не прерывать выполнение при ошибках ввода,
- Иметь возможность локализации сообщений.

Пакет `@mirta/staged-args` предназначен исключительно для **Node.js-инструментов** (≥ 20.6.0), не используется в рантайме Duktape.

## 📦 Установка

```sh
pnpm add @mirta/staged-args
```

## 🚀 Быстрый старт

Создайте экземпляр парсера с аргументами командной строки:

```ts
import { createStagedArgs } from '@mirta/staged-args'

const staged = createStagedArgs(process.argv.slice(2))
```

Определите схему опций:

```ts
const schema = {
  config: { type: 'string', default: 'mirta.json' },
  verbose: { type: 'boolean' },
} as const
```

Выполните поэтапный разбор:

```ts
const result = staged.parse(schema)

if (result.hasErrors) {
  // Обработка ошибок
  result.errors.forEach(error => {
    console.error(`Ошибка: ${error.type}, опция: ${error.option}`)
  })
  process.exit(1)
}

const { data: globals } = result
console.log('Глобальные флаги:', globals)
```

Позиционные аргументы (например, команда и её параметры) доступны через `positionals`:

```ts
const { positionals } = result.data
// → ['deploy', 'staging']
```

> ⚠️ **Неизвестные опции** (например, `--force`) **не попадают в `positionals`** — они остаются опциями и могут быть отловлены как `unknown-option` при использовании `parseFinal`.

Для продолжения разбора используйте `stagedArgs`:

```ts
const { stagedArgs } = result.data
const commandResult = stagedArgs.parseFinal(commandSchema)
```

## 🔍 Архитектура

### Поэтапный парсинг (Staged Parsing)

`@mirta/staged-args` позволяет:
- Разделить разбор аргументов на этапы.
- Сначала обработать флаги, влияющие на конфигурацию.
- Позже — разобрать команду и её опции, основываясь на загруженных данных.

Это критично для инструментов вроде `@mirta/cli`, `create-mirta`, `nx`, где `--config` должен быть обработан **до** выбора команды.

> ⚠️ Парсер отслеживает, **какие позиционные аргументы уже использовались как значения** (например, `--port 3000`), и помечает их индексы, чтобы избежать повторного присваивания.  
> Однако **сами опции (например, `--port`) не "исчезают"** — они могут быть обработаны снова на следующих этапах, если указаны в схеме.  
> Это гарантирует, что значение `deploy` не будет ошибочно использовано как значение для `--port` на втором этапе.

### Безопасный результат: `Result<T, E>`

Функции `parse` и `parseFinal` возвращают:

```ts
type Result<TData, TError>
  = | { hasErrors: false, data: TData }
    | { hasErrors: true, errors: TError[] }
```

➡️ Пока вы не проверите `hasErrors`, **поле `data` недоступно в типовой системе**.  
➡️ Это **принуждает к явной обработке ошибок** и предотвращает использование некорректных данных.

#### Почему это важно

```ts
if (result.hasErrors) {
  // ❌ TypeScript не позволит обратиться к result.data
  console.log(result.data.values) // → Ошибка компиляции
}

// ✅ Только после проверки
if (!result.hasErrors) {
  console.log(result.data.values)        // → OK
  console.log(result.data.positionals)   // → OK
  console.log(result.data.stagedArgs)    // → OK — можно продолжить разбор
}
```

Такой подход:
- Гарантирует, что вы не используете данные при наличии ошибок.
- Делает `stagedArgs` доступным **только при успешном разборе**.
- Совместим с системами локализации, такими как `@mirta/i18n`.

### Гибкие подсказки: `suggest?: SuggestFunc`

Можно передать функцию подсказки:

```ts
const args = createStagedArgs(process.argv.slice(2), {
  suggest: (unknown, known) => {
    return known.includes('config') ? 'config' : undefined
  }
})
```

Или использовать `suggestClosest` из `@mirta/basics/fuzzy`:

```ts
import { suggestClosest } from '@mirta/basics/fuzzy'

const staged = createStagedArgs(process.argv.slice(2), {
  suggest: suggestClosest,
})
```

Это **не обязательная зависимость** — вы решаете, какую стратегию использовать.

### Ошибки времени выполнения и разработки

- `ParseError` — возвращается в `Result`:  
  ```ts
  { type: 'unknown-option', option: '--confog', suggestion: 'config' }
  ```
  Подлежит локализации, не прерывает выполнение.

- `SchemaError` — выбрасывается как исключение:  
  Например, при дублировании имён опций.  
  Это **ошибка разработки**, не может возникнуть у конечного пользователя.

## 🧰 API

### `createStagedArgs(args: string[], options?: { suggest?: SuggestFunc }): StagedArgs`

Создаёт экземпляр парсера.

#### Параметры:
- `args` — массив строк (обычно `process.argv.slice(2)`).
- `options.suggest` — функция, возвращающая возможную коррекцию для неизвестной опции.

#### Возвращает:
Объект с методами `parse`, `parseFinal`.

---

### `parse<TSchema>(schema: TSchema): Result<Values<TSchema>, ParseError>`

Разбирает аргументы по схеме.  
Сохраняет состояние: какие опции и значения уже обработаны.

#### Возвращает:
`Result<ParsedArgs<TSchema>, ParseError>`, где поле `data` содержит:
- `values` — распарсенные значения опций,
- `positionals` — необработанные позиционные аргументы,
- `stagedArgs` — новый этап парсинга, включающий текущую схему (можно продолжать разбор).

> ✅ Используйте `parse` для **многоэтапного** разбора.

---

### `parseFinal<TSchema>(schema: TSchema): Result<Values<TSchema>, ParseError>`

Аналог `parse`, но считается **финальным этапом**:
- Проверяет наличие неизвестных опций → ошибка `unknown-option`.
- Не возвращает `stagedArgs` — дальнейший парсинг невозможен.

#### Возвращает:
`Result<ParsedArgsFinal<TSchema>, ParseError>`, где поле `data` содержит:
- `values` — распарсенные значения,
- `positionals` — позиционные аргументы.

> ⚠️ Используйте `parseFinal` для команд или финальной валидации.

---

### `getRemainingArgs(): string[]`

Возвращает необработанные аргументы для передачи следующему этапу.

---

### `type ParseError`

Поддерживаемые типы ошибок:

```ts
| { type: 'unknown-option', option: string, suggestion?: string }
| { type: 'missing-value', option: string }
```

## ✅ Пример: многоэтапный CLI

```ts
const staged = createStagedArgs(process.argv.slice(2), { suggest: suggestClosest })

// Этап 1: глобальные флаги
const globalSchema = { config: { type: 'string' }, verbose: { type: 'boolean' } } as const
const globalResult = staged.parse(globalSchema)

if (globalResult.hasErrors) {
  // Показываем локализованные сообщения
  logErrors(globalResult.errors)
  process.exit(1)
}

// ✅ data доступно — ошибок нет
const { positionals, stagedArgs } = globalResult.data

// Загружаем конфиг на основе --config
const config = loadConfig(globalResult.data.values.config)

// Этап 2: команда и её позиционные параметры
const command = positionals[0]
if (!command) {
  console.error('Команда не указана')
  process.exit(1)
}

const commandSchema = config.commands[command]
if (!commandSchema) {
  console.error(`Неизвестная команда: ${command}`)
  process.exit(1)
}

// Продолжаем разбор: опции вроде --verbose остаются доступными
const commandResult = stagedArgs.parseFinal(commandSchema)

if (commandResult.hasErrors) {
  logErrors(commandResult.errors)
  process.exit(1)
}

// Выполняем
run(command, globalResult.data.values, commandResult.data.values)
```

## 🛠 Внутренняя архитектура

- **Модульность**: каждый компонент — отдельный файл.
- **Без зависимостей**: только `node:util`.
- **ESM-first**: поддержка `#src/*` через `imports`.
- **TypeScript**: полная типизация, включая вывод `Values<TSchema>`.
