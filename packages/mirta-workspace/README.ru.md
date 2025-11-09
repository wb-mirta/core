# `@mirta/workspace`

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-workspace/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-workspace/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/workspace?style=flat-square)](https://npmjs.com/package/@mirta/workspace)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/workspace?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/workspace)

> Утилиты для анализа структуры репозитория в проектах на базе фреймворка Mirta.

`@mirta/workspace` помогает инструментам определить:
- Где находится корень проекта?
- Какой пакетный менеджер используется?
- Какие пакеты объявлены в `workspaces`?

Предназначен для переиспользования в других пакетах без тяжёлых зависимостей (например, от Rollup).<br/>

**Не предназначен для выполнения в среде Duktape на контроллерах Wiren Board.**

---

## 📦 Установка

```bash
# Не требуется напрямую — используется внутри Mirta
pnpm add -D @mirta/workspace
```
⚠️ Этот пакет — часть внутренней инфраструктуры фреймворка Mirta. Обычно он не используется напрямую.

## 🚀 Быстрый старт

```ts
import { resolveMonorepoContextAsync } from '@mirta/workspace'

const context = await resolveMonorepoContextAsync(process.cwd())

console.log(context.rootDir) // /home/user/my-mirta-repo
console.log(context.manager) // 'pnpm'
console.log(context.packages) // [{ name: '@mirta/core', workspacePath: 'packages/core' }, ...]
```
## 🧰 API

`resolveWorkspaceContextAsync(cwd: string): Promise<WorkspaceContext>`<br/>
Асинхронно определяет контекст рабочей области.

Находит корень проекта по наличию lock-файла (`pnpm-lock.yaml`, `yarn.lock` и др.) и читает `package.json`.

Возвращает:

```ts
interface WorkspaceContext {
  rootDir: string         // Корневая директория (где находится lock-файл)
  manager: PackageManager // 'pnpm' | 'yarn' | 'bun' | 'npm'
  workspaces?: string[]   // Массив glob-паттернов из поля `workspaces`
}
```
Выбрасывает: `WorkspaceError`, если:

Не найден lock-файл (`noLockfile`)<br/>
`workspaces` имеет недопустимый формат (`badWorkspacesFormat`)

---

`resolveMonorepoContextAsync(cwd: string): Promise<MonorepoContext>`<br/>
Асинхронно определяет полный контекст монорепозитория.

На основе `WorkspaceContext` находит все пакеты, объявленные в `workspaces`, и читает их `package.json` с помощью `@mirta/package`.

Возвращает:

```ts
interface MonorepoContext {
  rootDir: string
  manager: PackageManager
  packages: readonly PackageDefinition[]
}
```
Пакеты возвращаются отсортированными по длине пути (сначала — более вложенные), чтобы обеспечить корректность сопоставления в будущем.

Результат кэшируется по `rootDir` для производительности.

---

`toPosix(path: string): string`
Приводит путь к POSIX-формату (с `/`), даже на Windows.

Используется для нормализации путей перед сравнением и обработкой.

## 🧩 Поддерживаемые пакетные менеджеры

Определяются по lock-файлам:
- `pnpm` → `pnpm-lock.yaml`
- `yarn` → `yarn.lock`
- `npm` → `package-lock.json`
- `bun` → `bun.lock`

## ✅ Тестирование

Пакет полностью покрыт юнит-тестами:
- Поиск корня по lock-файлу
- Обработка `workspaces`
- Сбор пакетов, сортировка, кэширование
- Кроссплатформенность (Windows/POSIX)

Используется Vitest, моки зависимостей (`find-up`, `glob`, `@mirta/package`).

## ⚠️ Ограничения

**Работает только в Node.js** (не в Duktape).<br/>
workspaces должно быть массивом строк.
