# @mirta/cli

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/cli?style=flat-square)](https://npmjs.com/package/@mirta/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/cli?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/cli)

> Универсальный инструмент командной строки для выпуска и публикации релизов в монорепозиториях с синхронным семантическим версионированием.

`@mirta/cli` — оркестратор релизов, который:
- Синхронно обновляет версии в пакетах монорепозитория,
- Запускает генерацию `CHANGELOG` (если настроен),
- Публикует пакеты в NPM с поддержкой `--provenance` в CI.

Работает в любых монорепозиториях, использующих `pnpm` и следующих принципу синхронного семантического версионирования.

Чтобы распознать структуру монорепозитория, `@mirta/cli` полагается на пакеты `@mirta/workspace` и `@mirta/package`, которые считывают конфигурацию из поля `workspaces` в корневом `package.json`.

**Не предназначен для выполнения в среде Duktape на контроллерах Wiren Board.**

## 📦 Установка

```sh
pnpm add -wD @mirta/cli
```

✅ Этот пакет разработан для фреймворка Mirta, но работает в любых `pnpm`-монорепозиториях с синхронным версионированием.

## 🚀 Быстрый старт

**Запустите релиз**:

```sh
pnpm mirta release
```
Выберите тип обновления → версии обновятся.

**Опубликуйте (в CI или локально)**:

```sh
pnpm mirta publish
```
Все публичные пакеты отправятся в NPM.

## 🧰 Команды

### `mirta [options]`

Эти глобальные опции работают для всех команд:

- `--help` (`-h`) — отображает справку по доступным командам и параметрам.
- `--version` (`-v`) — выводит версию `@mirta/cli`.

### `pnpm mirta release`

Подготавливает релиз: определяет текущую версию, предлагает выбрать тип обновления (`patch`, `minor`, `major`, `pre*`) и применяет его ко всем пакетам, где указано поле `version`.

<details>
<summary>Технические подробности</summary>

Производимые манипуляции разделены на этапы.

Этап 1: если проект связан с `git`, при запуске первым делом проверяет:
- Синхронизацию с `origin`.
- Успешность CI (по workflow `build`).

Этап 2: для путей, указанных в `mirta.config.json#templates`, выполняет рекурсивное обнаружение `package.json` с последующим обновлением зависимостей монорепозитория (`dependencies`, `devDependencies`).

Этап 3: запускает `pnpm run changelog`, если скрипт существует.

Этап 4: если подключение к GitHub — по `ssh`, создаёт коммит и тег:
```sh
git commit -m "release: vX.X.X"
git tag vX.X.X
```
При подключении к GitHub по `https` изменения остаются в рабочей директории. Вы можете зафиксировать изменения вручную или через GUI-клиент (например, GitHub Desktop).

</details>

#### Поддерживаемые опции

`--dry` — запускает команду в режиме симуляции. Показывает изменения, но не применяет их.

`--preid` `<id>` — задаёт кастомный префикс для преверсии (например, `alpha`, `beta.1`, `rc`).

`--skipPrompts` — пропускает интерактивные запросы. Используются значения по умолчанию.

`--skipGit` — не создаёт коммит и тег. Git-изменения остаются в рабочей директории.

#### Частые вопросы

<details>
<summary>Почему версионирование синхронное?</summary>

Все пакеты монорепозитория получают одинаковую версию при релизе.

Это полезно, когда:
- Пакеты тесно связаны (например, часть одного фреймворка),
- Важна совместимость: `@mirta/cli@0.4.0` гарантированно работает с `@mirta/package@0.4.0`.
- Нужно упростить управление зависимостями.

В отличие от независимого версионирования пакетов, синхронное:
- Упрощает публикацию.
- Уменьшает количество версионных конфликтов.
- Делает релиз атомарным: все пакеты обновляются вместе.

💡 Если вы используете `workspace:*`, то при релизе все ссылки заменяются на конкретную версию — это и есть синхронное версионирование в действии.

</details>

<details>
<summary>Что такое «семантическая» версия?</summary>

Семантическая версия имеет формат `major.minor.patch`, где каждый сегмент обозначает разные уровни изменений:
- `major` — крупные изменения, возможны breaking changes,
- `minor` — добавление новых возможностей без нарушения совместимости,
- `patch` — исправление ошибок.

Версии до `1.0.0` (например, `0.4.0`) считаются экспериментальными:<br/>
любое обновление может включать breaking changes.

Подробнее на сайте [semver.org](https://semver.org/lang/ru/)

</details>

<details>
<summary>Как настроить генерацию файла CHANGELOG.md?</summary>

Для генерации файла со списком изменений в dev-зависимости корневого `package.json` нужно добавить пакет [conventional-changelog-cli](https://www.npmjs.com/package/conventional-changelog-cli), а в секции `scripts` должна присутствовать команда `changelog`:

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

Список изменений в автоматически генерируемом Changelog основывается на выполненных в пределах версии коммитах. При этом есть требования к заголовкам:

1. Общая длина строки не должна превышать 50 символов;
2. Использовать префиксы вида `fix:`, `feat:`, `docs:`, `chore:` и т.п.

Полный список требований смотреть в соглашении [Commit Convention](https://github.com/wb-mirta/core/blob/latest/.github/commit-convention.md) фреймворка.

</details>

#### Расширенное управление

<details>
<summary>Явное указание версии</summary>

Установит ровно ту версию, которая передана в качестве аргумента:

```sh
pnpm mirta release 1.2.3
```
⚠️ **Внимание!** Не пытайтесь перезаписать уже опубликованные версии - реестр NPM такое не пропустит.

</details>


<details>
<summary>Инкремент: patch, minor, major</summary>

```sh
pnpm mirta release patch
# 0.0.1
```
```sh
pnpm mirta release minor
# 0.1.0
```
```sh
pnpm mirta release major
# 1.0.0
```

</details>

<details>
<summary>Преверсии: alpha, beta, rc</summary>

```sh
pnpm mirta release prepatch --preid alpha
# 0.0.1-alpha.0
```

```sh
pnpm mirta release preminor --preid alpha
# 0.1.0-alpha.0
```

```sh
pnpm mirta release premajor --preid alpha
# 1.0.0-alpha.0
```

#### Инкремент предварительной версии

```sh
pnpm mirta release prerelease --preid alpha
# 0.0.1-alpha.1
```

</details>

---

### `pnpm mirta publish`

Осуществляет публикацию в NPM, пропуская пакеты с `private: true`.

<details>
<summary>Технические подробности</summary>

⚠️ Обычно вызывается в CI/CD после `git push` тега `vX.X.X`.

Тег определяется автоматически:
- `alpha` → `--tag` `alpha`
- `beta` → `--tag` `beta`
- `rc` → `--tag` `rc`

В CI (если `process.env.CI`) добавляет `--provenance`.

</details>

#### Поддерживаемые опции

`--dry` — запускает команду в режиме симуляции. Показывает изменения, но не применяет их.

`--skipBuild` — пропускает выполнение `pnpm run build` перед публикацией.

`--skipGit` — отключает проверки git-состояния (аналог `--no-git-checks` в `pnpm publish`).

## ✅ Тестирование

Инструмент протестирован вручную и в CI:
- Интерактивный и автоматический релиз.
- Обработка ошибок (откат версий при сбое).
- Проверка git-состояния и CI.
- Поддержка `--dry-run`.

## ⚠️ Ограничения

**Работает только в Node.js** (не в Duktape).<br/>
Автоматическое создание коммита и тега — только при `ssh`-подключении к GitHub.

## 🛠 Внутренняя конфигурация Mirta

Файл `mirta.config.json` позволяет настроить поведение `@mirta/cli` в рамках фреймворка Mirta.

На данный момент поддерживается:

`templates` — список путей к шаблонам (например, в `create-mirta`).

Пример:

```json
{
  "templates": [
    "packages/create-mirta/public/templates"
  ]
}
```
