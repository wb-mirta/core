import type { Pkcs11Path } from '#src/config/types'
import { logger } from '#utils/logger'
import { STDIO_INTERACTIVE } from '#src/utils/shell'
import { SSH_AUTH_SOCK } from './constants'
import { hasEntryAsync } from './entry'
import type { AgentContext } from './types'

/**
 * Удаляет PKCS#11 токен из SSH-агента.
 *
 * Использует команду `ssh-add -qe <path>` для выгрузки модуля.
 *
 * @param path - Путь к библиотеке PKCS#11 (например, `/usr/lib/libykcs11.so`).
 * @param context - Контекст выполнения, включая среду (WSL2) и переменные окружения.
 * @returns `true`, если токен успешно удалён, иначе `false`.
 *
 * @since 0.4.0
 *
 **/
export async function removeTokenAsync(
  path: Pkcs11Path,
  context: AgentContext
): Promise<boolean> {

  try {

    await context.runAsync(
      'ssh-add', ['-qe', path],
      {
        env: {
          SSH_AUTH_SOCK,
        },
        stdio: 'ignore',
      }
    )

    return true

  }
  catch {

    return false

  }

}

/**
 * Проверяет, добавлен ли PKCS#11 токен в SSH-агент.
 *
 * Анализирует вывод `ssh-add -l` на наличие пути к токену.
 *
 * @param path - Путь к библиотеке PKCS#11.
 * @param context - Контекст выполнения.
 * @returns `true`, если токен найден в агенте, иначе `false`.
 *
 * @since 0.4.0
 *
 **/
export async function hasTokenAsync(
  path: Pkcs11Path,
  context: AgentContext
): Promise<boolean> {

  // Для PKCS#11 токенов ssh-add -l выводит путь к библиотеке,
  // поэтому можем проверить наличие через простой поиск строки

  return await hasEntryAsync(path, context)

}

/**
 * Добавляет PKCS#11 токен в SSH-агент.
 *
 * Использует `ssh-add -s <path>`, с опциональным указанием времени жизни (`-t`).
 * Вывод команды передаётся в терминал для отображения подсказок (например, ввод PIN-кода).
 *
 * @param path - Путь к библиотеке PKCS#11.
 * @param context - Контекст выполнения.
 * @throws Ошибка, если команда завершилась с кодом, отличным от 0.
 *
 * @since 0.4.0
 *
 **/
export async function addTokenAsync(
  path: Pkcs11Path,
  context: AgentContext
): Promise<void> {

  const args = ['-q']

  if (context.ttl)
    args.push('-t', context.ttl)

  args.push('-s', path)

  await context.runAsync(
    'ssh-add',
    args,
    {
      env: {
        SSH_AUTH_SOCK,
      },
      stdio: STDIO_INTERACTIVE,
      cancelCodes: [2, 130],
    })

  logger.debug('PKCS#11 token added to ssh-agent')

}
