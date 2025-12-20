import type { DeployMapping, MirtaConnection } from '#src/config/types'
import { isExistsAsync, resolveSubpath } from '#src/utils/file-system'
import { useLogger } from '#src/utils/logger'
import { t } from '#src/i18n'
import { runCommandAsync } from '#src/utils/shell'
import { SSH_AUTH_SOCK } from '#src/auth/ssh-agent/constants'

const logger = useLogger()

export interface RunRsyncOptions {

  connection: MirtaConnection

  mapping: DeployMapping

  toGroup?: string

  cwd: string

  isDryRun?: boolean

}

export async function runRsyncAsync(options: RunRsyncOptions): Promise<void> {

  const {
    connection,
    mapping,
    toGroup,
    cwd,
    isDryRun,
  } = options

  const from = resolveSubpath(cwd, mapping.from)

  if (!await isExistsAsync(from)) {

    logger.step(t('deploy.sourceNotExists', {
      source: from,
    }))

    // Файлы могут отсутствовать, это допустимо.

    return

  }

  const to = `${connection.username}@${connection.hostname}:${mapping.to}/`

  const args: string[] = []

  const sshParts: string[] = []

  if (connection.port)
    sshParts.push(`-p ${connection.port}`)

  if (sshParts.length > 0)
    args.push('-e', `'ssh ${sshParts.join(' ')}'`)

  args.push(
    '-rltzvgO'
  )

  if (isDryRun)
    args.unshift('--dry-run', '--itemize-changes')

  if (mapping.cleanup)
    args.push('--delete')

  mapping.exclude?.forEach((pattern) => {

    args.push('--exclude', pattern)

  })

  mapping.protect?.forEach((pattern) => {

    args.push('--filter', `P ${pattern}`)

  })

  if (toGroup)
    args.push('--groupmap', `*:${toGroup}`)

  args.push(
    from,
    to
  )

  logger.step(t('deploy.transmitting', {
    from: mapping.from,
    to: mapping.to,
  }))

  await runCommandAsync.inUnixShell(connection.wsl)('rsync', [...args], {
    env: {
      SSH_AUTH_SOCK,
    },
    cwd,
    stdio: 'inherit',
    shell: false,
  })

}
