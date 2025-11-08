# `@mirta/package`

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-package/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-package/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/package?style=flat-square)](https://npmjs.com/package/@mirta/package)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/package?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/package)

> Простой и надёжный способ чтения `package.json` в инструментах Mirta.

`@mirta/package` — это утилита для безопасного чтения `package.json` в среде разработки. Она поддерживает:
- TypeScript-типизацию
- Чёткую обработку ошибок
- Работу только с нужными полями: `name`, `exports`, `workspaces`

Используется внутри `@mirta/workspace`, `@mirta/rollup` и других инструментов Mirta для анализа структуры проекта.<br/>

**Не предназначен для выполнения в среде Duktape на контроллерах Wiren Board.**

## 📦 Установка

```bash
# Не требуется напрямую — используется внутри Mirta
pnpm add -D @mirta/package
```
⚠️ Этот пакет — часть внутренней инфраструктуры фреймворка Mirta. Обычно он не используется напрямую.

## 🚀 Быстрый старт

```ts
import { readPackage, PackageError } from '@mirta/package'

try {

  const pkg = readPackage('packages/core') // Путь к директории или файлу
  console.log(pkg.name)
  console.log(pkg.exports)

} catch (err) {

  if (err instanceof PackageError)
    console.error('Ошибка:', err.message)

}
```
## 🧰 API

`readPackage(path: string): Package`

Синхронно читает и парсит `package.json` по указанному пути.

Поддерживает:
- Путь к файлу: `'package.json'`, `'packages/core/package.json'`
- Путь к директории пакета: `'.'`, `'packages/core'`

Возвращает: объект типа `Package`.<br/>
Выбрасывает: `PackageError`, если файл не найден, недоступен или содержит невалидный JSON.

---
`parsePackageJson(content: string): Package`

Парсит строку с содержимым `package.json` в объект `Package`.

Используйте, если содержимое файла уже загружено (например, из кэша или теста).

---
`PackageError`

Класс ошибок с понятными сообщениями и кодами. Помогает быстро выяснить, что пошло не так.

Возможные коды ошибок:
- `notFound` — файл `package.json` не найден,
- `accessDenied` — нет прав на чтение файла,
- `invalidPath` — путь не ведёт к `package.json` или к папке пакета,
- `invalidJson` — повреждённый или невалидный JSON,
- `invalidJsonRoot` — корень JSON-файла не является объектом,
- `failedToRead` — не удалось прочитать файл.

Пример использования:

```ts
if (err.code === 'notFound') {
  console.error('Файл не найден:', err.message)
}
```
## 🧩 Поддерживаемые поля

Пакет читает только те поля `package.json`, которые нужны фреймворку:

`name`

Имя пакета, например: "@mirta/basics"

`exports`

Поддерживается упрощённый формат с `import`:

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
Или с типами:

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
Игнорируются: `require`, `node`, `browser` и другие условия.

`workspaces`

Разрешён только массив строк: `["packages/*"]`<br/>
Объектный формат (`{ packages: [...] }`) не поддерживается.

## ✅ Тестирование

Пакет полностью покрыт тестами:
- Успешное чтение `package.json`
- Обработка всех типов ошибок: файл не найден, нет доступа, невалидный JSON
- Поддержка разных путей
- Корректная миграция ошибок в `PackageError`
- Используется Vitest, моки зависимостей, изолированные тесты.

## ⚠️ Ограничения

- Работает только в Node.js (не в Duktape).
- Поддерживает только `import` в `exports`.
- Поле `workspaces` должно быть массивом строк.
- Синхронный API — не используйте в асинхронных средах без оборачивания.

## 🔄 Использование в `@mirta/workspace`

Этот пакет используется в `@mirta/workspace` для:
- Чтения `package.json` корневого проекта.
- Проверки поля `workspaces`.
- Сбора информации о каждом пакете в монорепозитории.

Пример:

```ts
const pkg = readPackage(`${rootDir}/packages/mirta-basics`)
```
Это обеспечивает единый, надёжный способ доступа к метаданным пакетов.