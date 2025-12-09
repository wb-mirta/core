import { useLogger } from '#src/utils/logger'
import { hasScript, updateVersion } from '#src/utils/package'
import { prompts } from '#src/utils/prompts'
import { runCommandAsync } from '#src/utils/shell'
import chalk from 'chalk'
import type { ReleaseContext } from './types'

const logger = useLogger()
const { yellow } = chalk

export async function executeReleaseAsync(
  context: ReleaseContext
): Promise<void> {

  const runIfNotDry = runCommandAsync.ifNotDry(context.isDryRun)

  let isCommitted = false

  try {

    await updateVersion(context.targetVersion)
    logger.log(`Version updated to ${yellow(`v${context.targetVersion}`)}`)

    if (context.inWorkTree && !context.skipGit && hasScript('changelog')) {

      logger.step('Generating changelog...')
      await runCommandAsync('pnpm', ['run', 'changelog'])

      if (!context.skipPrompts) {

        const { isContinue } = await prompts({
          type: 'confirm',
          name: 'isContinue',
          message: 'Changelog generated. Does it look good?',
        })

        if (!isContinue) {

          logger.step('Reverting version...')
          await updateVersion(context.currentVersion)

          return

        }

      }

    }

    logger.step('Updating lock-file...')
    await runIfNotDry('pnpm', ['install', '--prefer-offline'])

    if (
      context.inWorkTree
      && !context.skipGit
      && context.connectionType === 'ssh'
      && context.repository
    ) {

      const { stdout } = await runCommandAsync('git', ['diff'], { stdio: 'pipe' })

      if (stdout) {

        logger.step('Committing version changes...')
        await runIfNotDry('git', ['add', '-A'])
        await runIfNotDry('git', ['commit', '-m', `release: v${context.targetVersion}`])

        if (!context.isDryRun)
          isCommitted = true

        logger.step('Pushing tag and changes')

        const tagName = `v${context.targetVersion}`
        const { stdout: existingTag } = await runCommandAsync('git', ['tag', '-l', tagName], { stdio: 'pipe' })

        if (!existingTag) {

          await runIfNotDry('git', ['tag', tagName])

        }
        else {

          logger.warn(`Tag ${yellow(tagName)} already exists, skipping tag creation`)

        }

        await runIfNotDry('git', ['push', 'origin', `refs/tags/v${context.targetVersion}`])
        await runIfNotDry('git', ['push'])

        logger.note(
          yellow('Release will be done via GitHub Actions.')
          + `\nCheck status at https://github.com/${context.repository}/actions/workflows/release.yml`
        )

      }
      else {

        logger.step('No changes to commit.')

      }

    }

  }
  catch (e: unknown) {

    if (!isCommitted) {

      logger.step('Reverting version...')
      await updateVersion(context.currentVersion)

    }
    else {

      logger.warn('Version was already committed. Please manually resolve the issue.')

    }

    throw e

  }

}
