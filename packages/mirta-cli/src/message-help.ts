import chalk from 'chalk'
import { getLocale } from '#utils/localization'

const { dim, yellow } = chalk

const locale = getLocale()

const helpMessageEn = `\
Performs operations over monorepo projects powered by the Mirta Framework.

${yellow('Usage:')}
  mirta [command] [options...]

${yellow('Commands:')}
- release:
  ${dim('Increase package versions following semantic versioning rules.')}
- publish:
  ${dim('Builds and publishes packages to npm registry.')}

${yellow(`Options for 'release':`)}
  --dry
    ${dim('Runs the command in dry run mode, showing what would be done but not performing any actual changes. Useful for previewing changes before applying them.')}
  --preid <custom-pre-release-id>
    ${dim('Sets a custom pre-release identifier that will be appended to the version string (for example, beta.1). This option allows creating pre-release versions like alpha, beta, rc etc., prior to official stable releases.')}
  --skipPrompts
    ${dim('Skips user interaction prompts entirely. The command runs non-interactively, automatically proceeding with defaults or configured values where applicable.')}
  --skipGit
    ${dim('Omits Git-related actions such as committing changes, tagging commits, or pushing updates to remote repositories. This can be useful if you want to manually manage Git operations later.')}

${yellow(`Options for 'publish':`)}
  --dry
    ${dim('Runs the command in dry run mode, showing what would be done but not performing any actual changes. Useful for previewing changes before applying them.')}
  --skipBuild
    ${dim('Excludes running the build process after version bumps. Bypasses execution of tasks defined in the build pipeline, allowing users to control whether they need a rebuild after updating package versions.')}
  --skipGit
    ${dim('Omits Git-related actions such as committing changes, tagging commits, or pushing updates to remote repositories. This can be useful if you want to manually manage Git operations later.')}
    
`

const helpMessageRu = `\
Выполняет операции над проектами монорепозитория, работающими на базе фреймворка Mirta.

${yellow('Использование:')}
  mirta [command] [options...]

${yellow('Команды:')}
- release:
  ${dim('Повышение версий пакетов согласно правилам семантического версионирования.')}
- publish:
  ${dim('Сборка и публикация пакетов в реестр npm.')}

${yellow(`Опции для 'release':`)}
  --dry
    ${dim('Запускает команду в режиме симуляции ("dry run"), показывая изменения, которые будут произведены, но фактически ничего не меняя. Полезно для предварительного просмотра изменений перед применением.')}
  --preid <custom-pre-release-id>
    ${dim('Устанавливает кастомный префикс для предварительной версии, который добавляется к номеру версии пакета (например, beta.1). Эта опция позволяет создавать предварительные версии типа альфа, бета, RC и др. перед официальным стабильным выпуском.')}
  --skipPrompts
    ${dim('Пропускает интерактивные запросы пользователя. Команда выполняется автоматически, используя значения по умолчанию или заданные настройки.')}
  --skipGit
    ${dim('Игнорирует действия, связанные с системой контроля версий Git, такие как фиксация изменений, создание меток коммитов или отправка изменений на удалённый репозиторий. Может пригодиться, если вы хотите самостоятельно управлять операциями с Git позже.')}

${yellow(`Опции для 'publish':`)}
  --dry
    ${dim('Запускает команду в режиме симуляции ("dry run"), показывая изменения, которые будут произведены, но фактически ничего не меняя. Полезно для предварительного просмотра изменений перед применением.')}
  --skipBuild
    ${dim('Исключает запуск процесса сборки после обновления версий пакетов. Пропускает выполнение заданий, указанных в конвейере сборки, позволяя вам самим решать, необходима ли повторная компиляция после изменения номеров версий.')}
  --skipGit
    ${dim('Игнорирует действия, связанные с системой контроля версий Git, такие как фиксация изменений, создание меток коммитов или отправка изменений на удалённый репозиторий. Может пригодиться, если вы хотите самостоятельно управлять операциями с Git позже.')}
`

export const helpMessage = locale === 'ru-RU'
  ? helpMessageRu
  : helpMessageEn
