import chalk from 'chalk'
import { getLocale } from '#src/i18n'

const { dim, yellow } = chalk

const locale = getLocale()

const helpMessageEn = `\
Performs operations over monorepo projects powered by the Mirta Framework.

${yellow('Usage:')}
  mirta [command] [options...]

${yellow('Global flags:')}
  --help, -h
    ${dim('Displays help information about available commands and options.')}
  --version, -v
    ${dim('Prints the version of this CLI utility.')}

${yellow('Commands:')}
  release
  ${dim('Increase package versions following semantic versioning rules.')}
  publish
  ${dim('Builds and publishes packages to npm registry.')}

${yellow(`Options for 'release':`)}
  --dry-run, --dry
    ${dim('Runs the command in simulation mode. Shows what would change but does not apply modifications.')}
  --preid <id>
    ${dim('Sets a custom pre-release identifier (e.g., `alpha`, `beta.1`, `rc`).')}
  --skip-prompts
    ${dim('Skips interactive prompts, using default values.')}
  --skip-git
    ${dim('Disables creating a commit and tag. Git changes remain uncommitted.')}

${yellow(`Options for 'publish':`)}
  --dry-run, --dry
    ${dim('Runs in simulation mode. Shows what would happen, but does not publish')}
  --skip-build
  ${dim('Skips running `pnpm run build` before publishing.')}
  --skip-git
    ${dim('Disables git state checks (equivalent to `--no-git-checks` in `pnpm publish`).')}
`

const helpMessageRu = `\
Выполняет операции над проектами монорепозитория, работающими на базе фреймворка Mirta.

${yellow('Использование:')}
  mirta [command] [options...]

${yellow('Команды:')}
  release
  ${dim('Повышение версий пакетов согласно правилам семантического версионирования.')}
  publish
  ${dim('Сборка и публикация пакетов в реестр npm.')}

${yellow('Общие флаги:')}
  --help, -h
    ${dim('Отображает справку по доступным командам и параметрам.')}
  --version, -v
    ${dim('Выводит версию данной утилиты.')}

${yellow(`Опции для 'release':`)}
  --dry-run, --dry
    ${dim('Запускает команду в режиме симуляции. Показывает изменения, но не применяет их.')}
  --preid <id>
    ${dim('Задаёт кастомный префикс для преверсии (например, `alpha`, `beta.1`, `rc`).')}
  --skip-prompts
    ${dim('Пропускает интерактивные запросы. Используются значения по умолчанию.')}
  --skip-git
    ${dim('Не создаёт коммит и тег. Git-изменения остаются в рабочей директории.')}

${yellow(`Опции для 'publish':`)}
  --dry-run, --dry
    ${dim('Запускает команду в режиме симуляции. Показывает изменения, но не применяет их.')}
  --skip-build
    ${dim('Пропускает выполнение `pnpm run build` перед публикацией')}
  --skip-git
    ${dim('Отключает проверки git-состояния (аналог `--no-git-checks` в `pnpm publish`)')}
`

export const helpMessage = locale === 'ru-RU'
  ? helpMessageRu
  : helpMessageEn
