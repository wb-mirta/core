import { STDIO_CAPTURE_OUTPUT } from '#utils/shell';
import { SSH_AUTH_SOCK } from '#auth/constants';
import type { AuthContext } from '#auth/types';

/**
 * Проверяет, содержится ли указанный отпечаток (или путь к токену) в списке добавленных сущностей в SSH-агенте.
 *
 * Использует команду `ssh-add -l`, которая выводит список всех добавленных ключей и токенов.
 * Подходит как для проверки SSH-ключей (по отпечатку), так и для PKCS#11-токенов (по пути к библиотеке).
 *
 * @param fingerprint - Отпечаток ключа или путь к PKCS#11 модулю, который нужно проверить.
 * @param context - Контекст выполнения команды (включая настройки окружения и WSL2).
 * @returns `true`, если запись найдена в агенте, иначе `false`.
 *
 * @since 0.4.0
 *
 **/
export async function hasEntryAsync(
  fingerprint: string,
  context: AuthContext
): Promise<boolean> {

  const response = await context.runAsync(
    'ssh-add', ['-l'],
    {
      env: {
        SSH_AUTH_SOCK,
      },
      stdio: STDIO_CAPTURE_OUTPUT,
      doneCodes: [0, 1], // 0 = есть ключи, 1 = нет ключей
    }
  );

  if (response.code === 1)
    return false;

  return response.stdout.includes(fingerprint);

}
