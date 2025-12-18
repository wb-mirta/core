import chalk from 'chalk'
import { isString } from '@mirta/basics'
import { getConnectionTarget, resolveConnection } from '#src/config/connection'
import { useLogger } from '#src/utils/logger'
import { t } from '#src/i18n'
import { runRsyncAsync } from './rsync'
import type { StagedArgs } from '#src/staged-args'
import { parseArgs } from './args'
import { resolveConfigAsync } from '#src/config/resolve'
import { authenticateAsync } from '#src/auth'
import { resolveWorkspaceContextAsync } from '@mirta/workspace'
import { loadEnv } from '#src/utils/env'

const { yellow } = chalk

const logger = useLogger()

export async function runAsync(args: StagedArgs) {

  const { values: argv } = parseArgs(args)

  const isDryRun = argv['dry-run']

  const profileName = argv.profile && isString(argv.profile)
    ? argv.profile
    : 'default'

  const cwd = process.cwd()

  const context = await resolveWorkspaceContextAsync(cwd)
  const rootDir = context.rootDir

  const { config, userConfig } = await resolveConfigAsync(rootDir, argv.config)

  // Полный набор маппингов из конфигурации.
  const mappingPresets = config.deploy?.mappings ?? {}

  // Используемый профиль.
  const profile = config.deploy?.profiles?.[profileName]
  const isImplicitProfile = !userConfig?.deploy?.profiles?.[profileName]

  if (!profile)
    throw new Error(t('deploy.profileNotFound', { name: profileName }))

  // Загружаем .env ДО resolveConnection, чтобы работала подстановка dotenv.
  loadEnv(rootDir, cwd)

  // Используемое подключение к контроллеру.
  const connection = resolveConnection(config, argv.to ?? profile.connection)

  logger.log(t('deploy.deploying', {

    target: yellow(getConnectionTarget(connection)),

    mode: yellow(isDryRun ? 'dry-run' : 'live'),

    profile: isImplicitProfile
      ? t('deploy.profileImplicit', { name: yellow(profileName) })
      : yellow(profileName),

  }))

  // Аутентификация подключения к контроллеру.
  //
  await authenticateAsync(connection)

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
        connection,
        cwd,
        isDryRun,
      })

    }

  }

  logger.success(isDryRun
    ? t('deploy.simulationComplete')
    : t('deploy.successful')
  )

}
