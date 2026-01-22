import chalk from 'chalk'
import { getLocale } from '#src/i18n'

const { dim, yellow } = chalk

const helpMessageEn = `\
Performs operations over projects powered by the Mirta Framework.

${yellow('Usage:')}
  mirta [command] [options...]

${yellow('Global flags:')}
  --help, -h
    ${dim('Displays help information about available commands and options.')}
  --version, -v
    ${dim('Prints the version of this CLI utility.')}
  --dry-run
    ${dim('Runs the command in simulation mode. Does not apply changes.')}
  --debug
    ${dim('Enables debug mode with detailed logging output.')}

${yellow('Commands:')}
  release
  ${dim('Increase package versions following semantic versioning rules.')}
  publish
  ${dim('Builds and publishes packages to npm registry.')}
  deploy
  ${dim('Deploy project files to Wiren Board controller.')}

${yellow(`Options for 'release':`)}
  --preid <id>
    ${dim('Sets a custom pre-release identifier (e.g., `alpha`, `beta.1`, `rc`).')}
  --skip-prompts
    ${dim('Skips interactive prompts, using default values.')}
  --skip-git
    ${dim('Disables creating a commit and tag. Git changes remain uncommitted.')}

${yellow(`Options for 'publish':`)}
  --skip-build
  ${dim('Skips running `pnpm run build` before publishing.')}
  --skip-git
    ${dim('Disables git state checks (equivalent to `--no-git-checks` in `pnpm publish`).')}

${yellow(`Options for 'deploy':`)}
  --profile <name>, -p
    ${dim('Use specified deploy profile.')}
  --to <connection>
    ${dim('Override connection string from profile.')}
  --config <path>, -c
    ${dim('Use custom configuration file.')}
  --insecure
    ${dim('Disable security warnings.')}
`

const helpMessageRu = `\
Выполняет операции над проектами, работающими на базе фреймворка Mirta.

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
  --dry-run
    ${dim('Режим симуляции. Показывает изменения, но не применяет их.')}
  --debug
    ${dim('Включает режим отладки с подробным выводом логов.')}

${yellow(`Опции для 'release':`)}
  --preid <id>
    ${dim('Задаёт кастомный префикс преверсии (например, `alpha`, `beta.1`, `rc`).')}
  --skip-prompts
    ${dim('Пропускает интерактивные запросы. Используются значения по умолчанию.')}
  --skip-git
    ${dim('Не создаёт коммит и тег. Git-изменения остаются в рабочей директории.')}

${yellow(`Опции для 'publish':`)}
  --skip-build
    ${dim('Пропускает выполнение `pnpm run build` перед публикацией')}
  --skip-git
    ${dim('Отключает проверки git-состояния (аналог `--no-git-checks` в `pnpm publish`)')}

${yellow(`Опции для 'deploy':`)}
  --profile <name>, -p
    ${dim('Использовать указанный профиль деплоя.')}
  --to <connection>
    ${dim('Переопределить строку подключения из профиля.')}
  --config <path>, -c
    ${dim('Использовать кастомный файл конфигурации.')}
  --insecure
    ${dim('Отключить предупреждения безопасности.')}
`

export const getHelpMessage
  = () => getLocale() === 'ru-RU'
    ? helpMessageRu
    : helpMessageEn
