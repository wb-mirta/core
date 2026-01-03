import chalk from 'chalk'
import { prompts } from '#utils/prompts'
import { t } from '#i18n'

export async function confirmOverwriteAsync(
  projectRoot: string
): Promise<boolean> {

  const locationText = t('overwrite.notEmpty', { path: chalk.yellow(projectRoot) })
  const promptText = chalk.red(t('overwrite.prompt'))

  const { canOverwrite } = await prompts({

    type: 'confirm',
    name: 'canOverwrite',
    message: `${locationText}\n  ${promptText}`,
    initial: false,

  }) as { canOverwrite: boolean }

  return canOverwrite

}
