import { MIRTA_AGENT_BINDING } from '#src/auth/ssh-agent/constants'
import type { MirtaConnection } from '#src/config/types'
import { useLogger } from './logger'
import { runCommandAsync } from './shell'

const logger = useLogger()

export async function hasRemoteGroupAsync(
  group: string,
  connection: MirtaConnection
): Promise<boolean> {

  const { hostname, username, port } = connection

  const target = `${username}@${hostname}`

  const args: string[] = []

  if (port)
    args.push('-p', String(port))

  args.push('getent group', group, '> /dev/null 2>&1')

  try {

    const result = await runCommandAsync.inUnixShell(connection.wsl)(
      MIRTA_AGENT_BINDING,
      ['ssh', target, ...args],
      {
        stdio: 'pipe',
        shell: false,
        doneCodes: [0, 2],
        cancelCodes: [130],
      }
    )

    return result.code === 0

  }
  catch (e: unknown) {

    logger.warn(e instanceof Error ? e.message : String(e))

    return false

  }

}
