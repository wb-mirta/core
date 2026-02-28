import { SSH_AUTH_SOCK } from '#auth/constants';
import type { MirtaConnection } from '#config/types';
import { runCommandAsync, STDIO_CAPTURE_ERRORS, STDIO_INTERACTIVE } from './shell';

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
  connection: MirtaConnection,
  isPasswordAuth: boolean
): Promise<boolean> {

  const { hostname, username, port } = connection;

  const args: string[] = [];

  if (port)
    args.push('-p', String(port));

  args.push(`${username}@${hostname}`, `getent group ${group} > /dev/null 2>&1`);

  const result = await runCommandAsync.inUnixShell(connection.wsl)('ssh', args, {
    env: {
      SSH_AUTH_SOCK,
    },
    stdio: isPasswordAuth
      ? STDIO_INTERACTIVE
      : STDIO_CAPTURE_ERRORS,
    doneCodes: [0, 2],
    cancelCodes: [130],
  });

  return result.code === 0;

}
