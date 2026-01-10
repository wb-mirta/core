import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import { runCommandAsync } from '#utils/shell'

function getCurrentPackageManager() {

  const userAgent = process.env.npm_config_user_agent

  if (!userAgent)
    return

  const [name, version] = userAgent.split(' ')[0].split('/')

  return {
    name,
    version,
  }

}

function toAnswers(...managers: string[]) {

  return managers.map(manager => ({

    title: t('dependencies.answer.yesUsing', { manager }),
    value: manager,

  }))

}

export async function promptInstallDependenciesAsync(cwd: string) {

  const currentManager = getCurrentPackageManager()

  const { manager } = await prompts({

    type: 'select',
    name: 'manager',
    message: t('dependencies.prompt'),
    hint: `(${t('hint.recommended').toLowerCase()})`,
    choices: currentManager
      ? [
          {
            title: t('dependencies.answer.yesUsing', { manager: currentManager.name }),
            value: currentManager.name,
          },
          {
            title: t('dependencies.answer.no'),
            value: '',
          },
        ]
      : [
          ...toAnswers('pnpm', 'yarn', 'npm', 'bun'),
          {
            title: t('dependencies.answer.no'),
            value: '',
          },
        ],

  }) as { manager: string | undefined }

  if (!manager)
    return

  await runCommandAsync(manager, ['install'], { cwd, shell: true })

}
