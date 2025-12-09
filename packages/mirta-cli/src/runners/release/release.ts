import { useLogger } from '#src/utils/logger'
import { hasScript, updateVersion } from '#src/utils/package'
import { prompts } from '#src/utils/prompts'
import { runCommandAsync } from '#src/utils/shell'
import chalk from 'chalk'
import type { ReleaseContext } from './types'
import { t } from '#src/i18n/index'

const logger = useLogger()
const { yellow } = chalk

export async function executeReleaseAsync(
  context: ReleaseContext
): Promise<void> {

  const runIfNotDry = runCommandAsync.ifNotDry(context.isDryRun)

  let isCommitted = false

  try {

    await updateVersion(context.targetVersion)

    logger.log(t('release.versionUpdated', {
      newVersion: yellow(`v${context.targetVersion}`),
    }))

    if (context.inWorkTree && !context.skipGit && hasScript('changelog')) {

      logger.step(t('release.changelogGenerating'))

      await runCommandAsync('pnpm', ['run', 'changelog'])

      if (!context.skipPrompts) {

        const { isContinue } = await prompts({
          type: 'confirm',
          name: 'isContinue',
          message: t('release.changelogConfirm'),
        })

        if (!isContinue) {

          logger.cancel(t('release.canceled'))

          logger.step(t('release.versionReverting'))

          await updateVersion(context.currentVersion)

          logger.step(t('release.versionReverted', {
            oldVersion: yellow(`v${context.currentVersion}`),
          }))

          return

        }

      }

    }

    logger.step(t('release.lockfileUpdating'))

    await runIfNotDry('pnpm', ['install', '--prefer-offline'])

    if (!context.inWorkTree || !context.repository) {

      logger.note(t('release.final.noGit'))
      return

    }

    if (!context.skipGit && context.connectionType === 'ssh') {

      const { stdout } = await runCommandAsync('git', ['diff'], { stdio: 'pipe' })

      if (stdout) {

        logger.step(t('release.committing'))

        await runIfNotDry('git', ['add', '-A'])
        await runIfNotDry('git', ['commit', '-m', `release: v${context.targetVersion}`])

        if (!context.isDryRun)
          isCommitted = true

        logger.step(t('release.pushing'))

        const tagName = `v${context.targetVersion}`
        const { stdout: existingTag } = await runCommandAsync('git', ['tag', '-l', tagName], { stdio: 'pipe' })

        if (!existingTag) {

          await runIfNotDry('git', ['tag', tagName])

        }
        else {

          logger.warn(t('release.tagAlreadyExists', {
            tag: yellow(tagName),
          }))

        }

        await runIfNotDry('git', ['push'])
        await runIfNotDry('git', ['push', 'origin', `refs/tags/v${context.targetVersion}`])

        logger.note(yellow(t('release.final.gitRemote')))
        logger.note(t('release.final.gitRemoteStatus', {
          workflowLink: `https://github.com/${context.repository}/actions/workflows/release.yml`,
        }))

      }
      else {

        logger.step(t('release.final.gitNoChanges'))

      }

    }
    else {

      logger.note(t('release.final.gitManual', {
        version: yellow(`v${context.targetVersion}`),
      }))

    }

  }
  catch (e: unknown) {

    if (!isCommitted) {

      logger.step(t('release.versionReverting'))

      try {

        await updateVersion(context.currentVersion)

        logger.step(t('release.versionReverted', {
          oldVersion: yellow(`v${context.currentVersion}`),
        }))

      }
      catch (rollbackError: unknown) {

        logger.error(
          t('release.error.versionRevertingFailed')
          + '\n'
          + (rollbackError instanceof Error ? rollbackError.message : String(rollbackError))
        )

      }

    }
    else {

      logger.warn(t('release.error.versionAlreadyCommitted'))

    }

    throw e

  }

}
