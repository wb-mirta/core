import { getCurrentVersion } from '#src/utils/package'
import type { StagedArgs } from '@mirta/staged-args'
import { prerelease } from 'semver'
import { parseArgs } from './args'
import { determineTargetVersion } from './version'
import { checkIsInWorkTreeAsync } from '#src/utils/github'
import { runGitChecksAsync } from './git-checks'
import type { ReleaseContext } from './types'
import { prompts } from '#src/utils/prompts'
import { executeReleaseAsync } from './release'
import chalk from 'chalk'
import { resolveConfigAsync } from '#src/config/resolve'
import { logger } from '#utils/logger'

const { yellow } = chalk

export async function runAsync(args: StagedArgs): Promise<void> {

  // === 1. Парсинг аргументов ===

  const { values: argv, positionals } = parseArgs(args)

  const currentVersion = getCurrentVersion()
  const preid = argv.preid ?? prerelease(currentVersion)?.[0] as string | undefined

  const isDryRun = argv['dry-run'] ?? false
  const skipGit = argv['skip-git'] ?? false
  const skipPrompts = argv['skip-prompts'] ?? false

  // === 2. Проверка окружения ===

  const inWorkTree = await checkIsInWorkTreeAsync()

  // === 3. Git-проверки ===

  const gitContext = await runGitChecksAsync({ inWorkTree, skipGit })

  // === 4. Определение версии ===

  const targetVersion = await determineTargetVersion(
    currentVersion,
    preid,
    skipPrompts,
    positionals[1]
  )

  // === 5. Формирование контекста ===

  const context: ReleaseContext = {
    currentVersion,
    targetVersion,
    preid,
    isDryRun,
    skipGit,
    skipPrompts,
    inWorkTree,
    ...gitContext,
  }

  // === 6. Подтверждение (если нужно) ===

  if (!skipPrompts) {

    const { confirmRelease } = await prompts({
      type: 'confirm',
      name: 'confirmRelease',
      message: `Releasing ${yellow(`v${targetVersion}`)} → Continue?`,
    })

    if (!confirmRelease) {

      logger.cancel('Release canceled. No changes made')
      return

    }

  }
  else {

    logger.log(`Releasing ${yellow(`v${targetVersion}`)}`)

  }

  // === 7. Загружаем конфиг ===
  const { config: mirtaConfig } = await resolveConfigAsync(process.cwd(), argv.config)

  // === 8. Выполнение релиза ===

  await executeReleaseAsync(context, mirtaConfig)

}
