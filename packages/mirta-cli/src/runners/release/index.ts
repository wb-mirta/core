import { useLogger } from '#src/utils/logger'
import { getCurrentVersion } from '#src/utils/package'
import type { StagedArgs } from '#src/staged-args'
import { prerelease } from 'semver'
import { parseArgs } from './args'
import { determineTargetVersion } from './version'
import { checkIsInWorkTreeAsync } from '#src/utils/github'
import { runGitChecksAsync } from './git-checks'
import type { ReleaseContext } from './types'
import { prompts } from '#src/utils/prompts'
import { executeReleaseAsync } from './release'
import chalk from 'chalk'

const logger = useLogger()
const { yellow } = chalk

export async function runAsync(args: StagedArgs): Promise<void> {

  // === 1. Парсинг аргументов ===

  const { values: argv, positionals } = parseArgs(args)

  const currentVersion = getCurrentVersion()
  const preid = argv.preid ?? prerelease(currentVersion)?.[0] as string | undefined

  const isDryRun = argv['dry-run']
  const skipGit = argv['skip-git']
  const skipPrompts = argv['skip-prompts']

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

  // === 7. Выполнение релиза ===

  await executeReleaseAsync(context)

}
