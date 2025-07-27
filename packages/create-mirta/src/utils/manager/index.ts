import type { CliScope } from '../../types'
import { runCommand } from './run-command'

function getRunningPackageManager() {

  const userAgent = process.env.npm_config_user_agent

  if (!userAgent)
    return

  const [name, version] = userAgent.split(' ')[0].split('/')

  return {
    name,
    version,
  }

}

export const runningPackageManager = getRunningPackageManager()

export async function installDependencies(scope: CliScope) {

  if (!scope.packageManager)
    return

  const args = ['install']

  await runCommand(
    scope.packageManager,
    args,
    { root: scope.projectRoot }
  )

}
