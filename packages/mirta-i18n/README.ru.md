# @mirta/i18n

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-i18n/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-i18n/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/i18n?style=flat-square)](https://npmjs.com/package/@mirta/i18n)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/i18n?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/i18n)

> Библиотека локализации для CLI-инструментов Mirta Framework, с ICU-совместимым синтаксисом.

Пакет `@mirta/i18n` предназначен исключительно для **Node.js-инструментов** (≥ 20.6.0), не используется в рантайме Duktape.

## Особенности

- ✔️ Типобезопасность ключей и переменных — при определении `LocaleShape`
- ✔️ ICU-совместимый синтаксис: `{var}`, `{count, plural, ...}`, `offset`, `=n`, `#`
- ✔️ Асинхронная загрузка и кэширование `.json`
- ✔️ Zero dependencies — только необходимый минимум
- ✔️ Настраиваемый fallback (en-US по умолчанию)
- ✔️ Контракт `t(key, vars)` — единый интерфейс перевода

## 📦 Установка

```sh
pnpm add @mirta/i18n
```

⚠️ Этот пакет — часть внутренней инфраструктуры фреймворка Mirta. Обычно не используется напрямую.

## Использование

### 1. Подготовьте файлы локалей

Организуйте папку `locales` следующим образом:

```
<пакет>/
  locales/
    en-US.json
    ru-RU.json
```
Пример `en-US.json`:

```json
{
  "title": "Welcome",
  "files.plural": "{count, plural, =0{No files} one{One file} other{# files}}",
  "greeting": "Hello, {name}!"
}
```

### 2. Опишите LocaleShape

Для включения типобезопасности определите интерфейс, совместимый с `GenericShape`:

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
> 💡 Тип `LocaleShape` должен быть определён в проекте.  
> Mirta Framework использует внутренний скрипт генерации на основе `locales/en-US.json`.

> ⚠️ При отсутствии `LocaleShape` используется `GenericShape` — типы ключей и переменных не проверяются.

### 3. Инициализируйте локализацию

В пакете, который подлежит локализации:

```ts
// src/i18n/index.ts
import { initLocalizationAsync } from '@mirta/i18n'

export const { t, setLocaleAsync } = await initLocalizationAsync<LocaleShape>()
```

### 4. Используйте перевод

```ts
console.log(t('title')) // → "Welcome"
console.log(t('greeting', { name: 'Alice' })) // → "Hello, Alice!"
console.log(t('files.plural', { count: 5 })) // → "5 files"
```
Смена локали:

```ts
await setLocaleAsync('ru-RU')
console.log(t('title')) // → "Добро пожаловать"
```

## 📚 API

### `initLocalizationAsync<TShape>(options)`

Подготавливает подсистему локализации - загружает fallback-локаль, осуществляет попытку определения и установки системной локали.

#### Параметры

| Поле | Тип | Описание |
|------|-----|----------|
| `cwd` | `string` | Рабочая директория (по умолчанию: `process.cwd()`) |
| `fallbackLocale` | `string` | Резервная локаль (по умолчанию: `'en-US'`) |

#### Возвращает

`Promise<Localization<TShape>>`

#### Ошибки

- `fallbackLoadFailed` — если не удалось загрузить fallback-локаль.

---

### `Localization<TShape>`

| Метод | Тип | Описание |
|------|-----|----------|
| `t(key, vars?)` | `(key: K, vars?: VariablesOf<TShape, K>) => string` | Типобезопасный перевод |
| `getLocale()` | `() => Locale` | Текущая локаль |
| `setLocaleAsync(locale)` | `(locale: string) => Promise<void>` | Смена локали (нормализует и кэширует) |

---

### `Locale`

Тип: `Branded<string, 'Locale'>` - брендированный тип локали.

### `Lang`

Тип: `Branded<string, 'Lang'>` - брендированный тип языка.

## Ключевые возможности

### ✅ Опциональная типобезопасность

Функция `t()` обеспечивает типобезопасность **только при указании `LocaleShape`**:

- Проверка существования ключей
- Требование обязательных переменных
- Запрет лишних полей

```ts
t('files.plural', { count: 2 }) // ✅
t('files.plural', {})           // ❌ Ошибка: нет `count`
t('title', { name: 'John' })    // ❌ Ошибка: `title` не принимает переменные
```

### ✅ ICU-совместимый синтаксис

Поддерживает **ограниченный набор ICU MessageFormat**, достаточный для CLI:

- Интерполяция: `{name}`, `{user.name}`, `{file-count}` (разрешены: `a-z`, `A-Z`, `0-9`, `_`, `.`, `-`)
- Plural: `{count, plural, one{...} few{...} other{...}}`
- Offset: `offset:1`, `=0`, `#`

> ⚠️ Не поддерживает:
> - `select`, `selectordinal`, форматирование чисел/дат
> - Переменные с пробелами: `{first name}` → не заменяется
> - Вложенные `plural` или `#` внутри `=n`

> Реализовано без внешних зависимостей — только необходимый минимум.

#### Пример с `offset`

```json
"sockets.active": "{count, plural,
  offset:1
  =0 {Только сервер включён}
  one {Подключено ещё одно устройство}
  other {Подключены ещё # устройства}
}"
```

- `count = 1` → `# = 0` → "Только сервер включён"
- `count = 2` → `# = 1` → "Подключено ещё одно устройство"
- `count = 5` → `# = 4` → "Подключены ещё 4 устройства"

Позволяет исключить постоянные элементы из счётчика.

### ✅ Асинхронная инициализация и кэширование

- `initLocalizationAsync` загружает и кэширует `fallbackLocale` и системную локаль.
- `setLocaleAsync` кэширует уже загруженные локали — повторная загрузка не выполняется.
- Fallback при отсутствии перевода: `current → fallback → {{key}}`.

### ✅ Нормализация локалей

Функция `setLocaleAsync` принимает любую строку, но:
- Автоматически нормализует формат (например, `ru_RU` → `ru-RU`)
- При некорректном значении — использует `fallbackLocale`
- Поддерживает `en-US` и `ru-RU`

Нет необходимости вручную валидировать локаль.

### ✅ Поддержка языков

- `ru`: полная поддержка `one` / `few` / `many` (по [CLDR](https://cldr.unicode.org/))
- `en` и другие: `one` (если 1), иначе `other`

> Для языков с особыми формами множественного числа (например, `pl`, `ar`) требуется расширение `getPluralForm`.

#### Языковые особенности

В русском языке (`ru-RU`) дробные числа всегда используют форму `few` (например, `36.6 градуса`), независимо от целой части.

> При смешанном числе существительным управляет дробь, а не целое число.<br/>
> — Д. Э. Розенталь. *Справочник по правописанию и литературной правке*, § 164, п. 8

Форма `few` используется как ближайшая доступная в ICU, поскольку стандарт не предусматривает отдельной категории для дробных числительных.

## Когда использовать?

Используйте `@mirta/i18n`, если:
- Инструмент требует поддержки нескольких языков,
- Нужны точные формы множественного числа (особенно для русского),
- Локали хранятся в `.json` и загружаются асинхронно,
- Важны малый размер и отсутствие внешних зависимостей.

## Ограничения

- Тип `LocaleShape` должен быть объявлен до использования.
- Наборы локалей кэшируются — избегайте создания тысяч динамических локалей.
- Нет поддержки `select`, `selectordinal`, форматирования чисел и дат.
- Переменные с пробелами (`{first name}`) — не заменяются.
- Подстановка `#` учитывает `offset`, но не поддерживает форматирование.

## Тестирование

Пакет покрыт модульными тестами (`vitest`, `@mirta/testing`), проверяющими:
- Инициализацию,
- Перевод с переменными и plural,
- Смену локали,
- Fallback-логику.
