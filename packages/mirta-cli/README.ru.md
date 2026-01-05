# @mirta/cli

[![en](https://img.shields.io/badge/lang-en-dimgray.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.md)
[![ru](https://img.shields.io/badge/lang-ru-olivedrab.svg?style=flat-square)](https://github.com/wb-mirta/core/blob/latest/packages/mirta-cli/README.ru.md)
[![NPM Version](https://img.shields.io/npm/v/@mirta/cli?style=flat-square)](https://npmjs.com/package/@mirta/cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@mirta/cli?style=flat-square&logo=npm)](https://npmjs.com/package/@mirta/cli)

> Универсальный CLI-инструмент для версионирования, публикации и деплоя в монорепозиториях с синхронным семантическим версионированием.

`@mirta/cli` — оркестратор процессов, который:
- Синхронно обновляет версии в пакетах монорепозитория,
- Запускает генерацию `CHANGELOG` (если настроен),
- Публикует пакеты в NPM с поддержкой `--provenance` в CI,
- Синхронизирует артефакты с контроллерами Wiren Board через `rsync`.

Работает в любых монорепозиториях, использующих `pnpm` и синхронное семантическое версионирование.

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

**Разверните на контроллере**:

```sh
pnpm mirta deploy
```
Синхронизирует файлы по профилю (по умолчанию — `default`).

## 🧰 Команды

### `mirta [options]`

Эти глобальные опции работают для всех команд:

- `--help` (`-h`) — отображает справку по доступным командам и параметрам.
- `--version` (`-v`) — выводит версию `@mirta/cli`.
- `--locale <loc>` — задаёт язык интерфейса (`en`, `ru`).

### `pnpm mirta release`

Подготавливает релиз: определяет текущую версию, предлагает выбрать тип обновления (`patch`, `minor`, `major`, `pre*`) и применяет его ко всем пакетам с полем `version`.

<details>
<summary>Технические подробности</summary>

Процесс разделён на этапы:

#### Этап 1: Проверка git-состояния (если проект под git)
- Синхронизация с `origin`.
- Успешность CI (по workflow `build`).

#### Этап 2: Обновление зависимостей
- Для путей из `mirta.config.json#project.templates`, рекурсивно обнаруживает `package.json`.
- Зависимости монорепозитория (`dependencies`, `devDependencies`) обновляются до актуальной версии.

#### Этап 3: Генерация CHANGELOG
- Запускает `pnpm run changelog`, если такой скрипт существует.

#### Этап 4: Фиксация изменений
- При доступе к GitHub по `ssh` создаёт коммит и тег:
   ```sh
   git commit -m "release: vX.X.X"
   git tag vX.X.X
   ```
- При доступе по `https` изменения остаются в рабочей директории для ручной фиксации.

</details>

#### Поддерживаемые опции

`--dry-run` (`--dry`) — симуляция без применения изменений.

`--preid` `<id>` — кастомный префикс преверсии (`alpha.0`, `beta.1`).

`--skip-prompts` — пропускает интерактивные запросы.

`--skip-git` — не создаёт коммит и тег.

#### Частые вопросы

<details>
<summary>Почему версионирование синхронное?</summary>

Все пакеты получают одинаковую версию при релизе. Это обеспечивает:
- Гарантированную совместимость (`@mirta/cli@0.4.0` работает с `@mirta/package@0.4.0`),
- Атомарность релиза,
- Упрощение управления зависимостями.

💡 При использовании `workspace:*` все ссылки заменяются на конкретную версию при релизе.

</details>

<details>
<summary>Что такое «семантическая» версия?</summary>

Формат `major.minor.patch`:
- `major` — breaking changes,
- `minor` — новые возможности без нарушения,
- `patch` — исправления ошибок.

Версии до `1.0.0` (например, `0.4.0`) считаются экспериментальными:<br/>
любое обновление может включать breaking changes.

Подробнее на сайте [semver.org](https://semver.org/lang/ru/)

</details>

<details>
<summary>Как настроить генерацию CHANGELOG.md?</summary>

Добавьте в dev-зависимости корневого `package.json` пакет `conventional-changelog-cli` и определите скрипт:

```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

Список изменений формируется на основе коммитов. Требования к заголовкам:
- Длина ≤ 50 символов,
- Префиксы: `fix:`, `feat:`, `docs:`, `chore:` и др.

Подробнее: [Commit Convention](https://github.com/wb-mirta/core/blob/latest/.github/commit-convention.md)

</details>

#### Расширенное управление

<details>
<summary>Явное указание версии</summary>

Установит ровно ту версию, которая передана в качестве аргумента:

```sh
pnpm mirta release 1.2.3
```
⚠️ **Не перезаписывайте опубликованные версии — NPM это запрещает.**

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

#### Инкремент преверсии

```sh
pnpm mirta release prerelease --preid alpha
# 0.0.1-alpha.1
```

</details>

---

### `pnpm mirta publish`

Публикует пакеты в NPM, пропуская `private: true`.

<details>
<summary>Технические подробности</summary>

⚠️ Обычно запускается в CI после `git push` тега `vX.X.X`.

Тег публикации определяется автоматически:
- `alpha` → `--tag` `alpha`
- `beta` → `--tag` `beta`
- `rc` → `--tag` `rc`

В CI добавляется `--provenance` для подтверждения происхождения.

</details>

#### Поддерживаемые опции

- `--dry-run` (`--dry`) — симуляция.
- `--skip-build` — пропускает `pnpm run build`.
- `--skip-git` — отключает git-проверки (аналог `--no-git-checks` в `pnpm publish`).

---

### `pnpm mirta deploy`

Синхронизирует файлы с контроллерами Wiren Board через `rsync` по SSH.

<details>
<summary>Технические подробности</summary>

- Транспорт: `rsync -rtzgO` (рекурсивно, сжатие, сохранение времени и группы, без времени на папках).
- Поддержка WSL2: на Windows команды выполняются внутри WSL.
- Аутентификация:
  - Через изолированный `ssh-agent`.
  - Поддержка PKCS#11 (Rutoken) и SSH-ключей.
  - `ttl` — время жизни ключа.
- Режим `--dry-run`: показывает изменения без применения.
- Симлинки не передаются.

</details>

#### Поддерживаемые опции

- `--config`, `-c <path>` — путь к `mirta.config.json`.
- `--profile`, `-p <name>` — профиль деплоя (по умолчанию: `default`).
- `--to <conn>` — переопределение подключения.
- `--dry-run` — симуляция синхронизации.

Параметр `--to` принимает:
- Название подключения из файла конфигурации `mirta.config.json`, 
- Строку подключения, если она начинается с префикса `ssh://`.

#### Переменные окружения и секреты

Для безопасного хранения учётных данных используйте файл `.env.local` (игнорируется git):

```sh
# .env.local

SSH_KEY=~/.ssh/id_ed25519

# Доступно в конфигурации:
WB_CONN_OPTIONS=`key=${SSH_KEY};ttl=1h30m`
WB_CONN_WORK=`ssh://user@mycompany.local;${WB_CONN_OPTIONS}`
```
Поддерживаемые префиксы:
- `WB_` — переменные, специфичные для CLI
- `MIRTA_` — переменные для использования в любом контексте Mirta
- `NODE_ENV` — стандартное значение окружения

#### Формат строки подключения

```sh
ssh://[user@]host[:port][;param1=value1;param2=value2...]
```
Поддерживаемые параметры:

| Параметр | Описание | Пример |
|----------|---------|---------|
| `pkcs11` | Путь к библиотеке PKCS#11 (Rutoken) | `pkcs11=/usr/lib/librtpkcs11ecp.so` |
| `key` | Путь к SSH-ключу (ED25519, RSA) | `key=~/.ssh/id_ed25519` |
| `ttl` | Время жизни ключа в ssh-agent | `ttl=1h` |
| `wsl` | Дистрибутив WSL2 для Windows | `wsl=Debian` |

> Примечание: `pkcs11` имеет приоритет над `key`, если указаны одновременно.

Примеры:

```sh
# SSH-ключ ED25519
ssh://deploy@192.168.42.1;key=~/.ssh/id_ed25519;ttl=30m

# PKCS#11 токен (Rutoken) с WSL2 на Windows
ssh://deploy@192.168.42.1;pkcs11=/usr/lib/librtpkcs11ecp.so;wsl=Ubuntu-22.04

# С переменными окружения
ssh://deploy@${WB_HOST};key=${MIRTA_SSH_KEY}
```

<details>
<summary>Нюансы PKCS#11</summary>

Если `ssh-agent` выбрасывает ошибку `agent refused operation`:

- Путь к модулю PKCS#11 должен быть реальным — симлинки отклоняются
- Превышено число попыток ввода PIN-кода, токен заблокирован

</details>

#### Пример и описание структуры `mirta.config.json`

```jsonc
{
  // Строки подключений к контроллерам
  "connections": {
    // Без подробностей в публичном репозитории
    "work": "${WB_CONN_WORK}",
    // Частичное сокрытие подробностей
    "home": "ssh://user@192.168.42.1;${WB_CONN_OPTIONS};wsl=Ubuntu",
  },
  "deploy": {
    // Наборы правил синхронизации
    "mappings": {
      "wb-rules-es5": [
        {
          // Локальная папка (относительно корня проекта)
          "from": "dist/es5/wb-rules-rules",
          // Целевая папка на контроллере
          "to": "/mnt/data/etc/wb-rules-rules",
          // Группа пользователей с доступом на контроллере (опционально)
          "toGroup": "developers",
          // Удалять файлы в целевой папке, если их нет в исходной
          "cleanup": true,
          // Список файлов и папок, которые нельзя удалять при cleanup: true
          "protect": ["alarms.conf"]
        },
        // {
        //   Следующее правило синхронизации...
        // }
      ]
    },
    // Заранее настроенные сценарии деплоя
    "profiles": {
      "default": {
        // Массив имён наборов правил секции deploy.mappings
        "mappings": ["wb-rules-es5"],
        // Имя или строка подключения
        "connection": "work",
        // Группа пользователей с доступом на контроллере (опционально)
        "toGroup": "developers"
      }
    }
  }
}
```

## ✅ Тестирование

Инструмент протестирован вручную и в CI:
- Интерактивный и автоматический релиз.
- Обработка ошибок (откат версий при сбое).
- Проверка git-состояния и CI.
- Поддержка `--dry-run`.

Дополнительные испытания:

- Деплой с `Rutoken`, деплой с ключом `ED25519` в WSL2 под Windows и отдельно в Linux Debian (Trixie).

## ⚠️ Ограничения

**Работает только в Node.js** (не в Duktape).<br/>
Автоматическое создание коммита и тега — только при `ssh`-подключении к GitHub.<br/>
WSL2 требуется для деплоя под Windows.

## 🛠 Конфигурация Mirta

Файл `mirta.config.json` настраивает поведение `@mirta/cli`.

Поддерживаемые поля:

- `project.templates` — пути к шаблонам (например, для `create-mirta`).
- `connections` — именованные подключения.
- `deploy.mappings` — правила синхронизации.
- `deploy.profiles` — профили деплоя.
