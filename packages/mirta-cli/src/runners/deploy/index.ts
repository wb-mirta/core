import chalk from 'chalk'
import { isString } from '@mirta/basics'
import { getConnectionTarget, resolveConnection } from '#src/config/connection'
import { logger } from '#src/utils/logger'
import { t } from '#src/i18n'
import { runRsyncAsync } from './rsync'
import type { StagedArgs } from '#src/staged-args'
import { parseArgs } from './args'
import { resolveConfigAsync } from '#src/config/resolve'
import { authenticateAsync } from '#src/auth'
import { resolveWorkspaceContextAsync } from '@mirta/workspace'
import { loadEnv } from '#src/utils/env'
import { hasRemoteGroupAsync } from '#src/utils/ssh'
import { RECOMMENDED_GROUP } from './constants'
import { assertWsl2ConfiguredAsync } from '#src/utils/wsl'

const { yellow } = chalk

/**
 * Асинхронно выполняет команду `deploy`.
 *
 * - Парсит аргументы
 * - Загружает конфигурацию
 * - Настраивает подключение и аутентификацию
 * - Проверяет окружение (WSL2)
 * - Выполняет синхронизацию файлов по заданным маппингам
 *
 * @param args - Аргументы командной строки, управляемые `StagedArgs`.
 *
 * @since 0.4.0
 *
 **/
export async function runAsync(args: StagedArgs) {

  const { values: argv } = parseArgs(args)

  const isDryRun = argv['dry-run']

  // Определение профиля деплоя.
  const profileName = argv.profile && isString(argv.profile)
    ? argv.profile
    : 'default'

  const cwd = process.cwd()

  // Определение корневой директории проекта.
  const context = await resolveWorkspaceContextAsync(cwd)
  const rootDir = context.rootDir

  // Загрузка и объединение конфигурации.
  const { config, userConfig } = await resolveConfigAsync(rootDir, argv.config)

  // Полный набор маппингов из конфигурации.
  const mappingPresets = config.deploy?.mappings ?? {}

  // Используемый профиль.
  const profile = config.deploy?.profiles?.[profileName]
  const isImplicitProfile = !userConfig?.deploy?.profiles?.[profileName]

  if (!profile)
    throw new Error(t('deploy.profileNotFound', { name: profileName }))

  // Загрузка переменных окружения ДО разрешения подключения.
  loadEnv(rootDir, cwd)

  // Определение подключения: из CLI-аргумента или профиля.
  const connection = resolveConnection(config, argv.to ?? profile.connection)

  // Проверка WSL2 на Windows.
  if (process.platform === 'win32')
    await assertWsl2ConfiguredAsync(connection)

  // Логирование начала операции.
  logger.log(t('deploy.deploying', {

    target: yellow(getConnectionTarget(connection)),

    mode: yellow(isDryRun ? 'dry-run' : 'live'),

    profile: isImplicitProfile
      ? t('deploy.profileImplicit', { name: yellow(profileName) })
      : yellow(profileName),

  }))

  // Аутентификация через ssh-agent (PKCS#11 или ключ).
  await authenticateAsync(connection)

  if (!profile.toGroup) {

    // Если группа не указана явно,
    // то проверяем наличие рекомендуемой группы.

    const isGroupExists = await hasRemoteGroupAsync(RECOMMENDED_GROUP, connection)

    if (isGroupExists) {

      profile.toGroup = RECOMMENDED_GROUP

    }
    else {

      // Если группы на контроллере нет,
      // то выводим рекомендацию использовать отдельную группу.

      logger.warn(t('deploy.useDedicatedGroup', { group: RECOMMENDED_GROUP }))

    }

  }

  // Выполнение синхронизации по маппингам.
  for (const key of profile.mappings ?? []) {

    if (!(key in mappingPresets))
      throw new Error(t('deploy.mappingsNotFound', { key }))

    const mappings = mappingPresets[key]

    for (const mapping of mappings) {

      if (mapping.enabled === false) {

        logger.log(t('deploy.mappingDisabled', {
          from: mapping.from,
          to: mapping.to,
        }))

        continue

      }

      await runRsyncAsync({
        mapping,
        toGroup: mapping.toGroup ?? profile.toGroup,
        connection,
        cwd,
        isDryRun,
      })

    }

  }

  // Финальное сообщение.
  logger.success(isDryRun
    ? t('deploy.simulationComplete')
    : t('deploy.successful')
  )

}
