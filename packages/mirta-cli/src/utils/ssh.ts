import { SSH_AUTH_SOCK } from '#src/auth/ssh-agent/constants'
import type { MirtaConnection } from '#src/config/types'
import { runCommandAsync, STDIO_CAPTURE_ERRORS } from './shell'
import { logger } from '#utils/logger'

/**
 * Проверяет, существует ли указанная группа на удалённом контроллере Wiren Board.
 *
 * Использует команду `getent group <group>` через SSH для проверки наличия группы.
 * Поддерживает выполнение через WSL2 на Windows.
 *
 * @param group - Имя группы (например, 'wb-users').
 * @param connection - Конфигурация подключения к контроллеру.
 * @returns `true`, если группа найдена, иначе `false`.
 *
 * @since 0.4.0
 *
 **/
export async function hasRemoteGroupAsync(
  group: string,
  connection: MirtaConnection
): Promise<boolean> {

  const { hostname, username, port } = connection

  const args: string[] = []

  if (port)
    args.push('-p', String(port))

  args.push(`${username}@${hostname}`, `getent group ${group} > /dev/null 2>&1`)

  try {

    const result = await runCommandAsync.inUnixShell(connection.wsl)('ssh', args, {
      env: {
        SSH_AUTH_SOCK,
      },
      stdio: STDIO_CAPTURE_ERRORS,
      doneCodes: [0, 2],
      cancelCodes: [130],
    })

    return result.code === 0

  }
  catch (e: unknown) {

    logger.warn(e instanceof Error ? e.message : String(e))

    return false

  }

}
