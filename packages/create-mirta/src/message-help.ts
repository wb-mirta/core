import chalk from 'chalk'
import { getLocale } from './utils/localization'

const { dim, yellow } = chalk

const locale = getLocale()

const helpMessageEn = `\
Creates a new wb-rules project with the Mirta Framework

Starts the CLI in interactive mode when no feature flags is provided,
or if the directory argument is not a valid project name.

${yellow('Usage:')}
  create-mirta [feature_flags...] [options...] [directory]

${yellow('Feature flags:')}
  --default
    ${dim('Create a project with the default configuration without any additional features')}
  --eslint
    ${dim('Add ESLint for code quality')}
  --vitest
    ${dim('Add Vitest for unit testing')}
  --store
    ${dim('Add store for state management')}

${yellow('Options:')}
  -v, --version
    ${dim('Display the version number of this CLI')}
  -f, --force
    ${dim('Create the project even if the directory is not empty')}
  -b, --bare
    ${dim('Create a barebone project without any code')}
  -h, --help
    ${dim('Display this help message')}
`

const helpMessageRu = `\
Создаёт новый проект wb-rules с использованием Mirta Framework

Запускает CLI в интерактивном режиме, если не указано флагов функционала
или название каталога не подходит в качестве названия проекта.

${yellow('Использование:')}
  create-mirta [feature_flags...] [options...] [directory]

${yellow('Флаги функционала:')}
  --default
    ${dim('Создаёт проект с конфигурацией по умолчанию, без дополнений')}
  --eslint
    ${dim('Добавить ESLint для контроля качества кода')}
  --vitest
    ${dim('Добавить Mirta Testing для юнит-тестирования')}
  --store
    ${dim('Добавить хранилище состояний')}

${yellow('Опции:')}
  -v, --version
    ${dim('Отобразить номер версии данного CLI')}
  -f, --force
    ${dim('Создать проект, даже если целевая директория содержит файлы')}
  -b, --bare
    ${dim('Создать проект-заготовку, без кода примеров')}
  -h, --help
    ${dim('Отобразить данное сообщение')}
`

export const helpMessage = locale === 'ru-RU'
  ? helpMessageRu
  : helpMessageEn
