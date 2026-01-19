import type { KeyPath } from '#config/types'
import { expandHomeDir } from '#utils/file-system'
import { logger } from '#utils/logger'
import { STDIO_INTERACTIVE } from '#utils/shell'
import { SSH_AUTH_SOCK } from '#auth/constants'
import { hasEntryAsync } from './entry'
import type { AuthContext } from '#auth/types'

/**
 * Получает отпечаток (fingerprint) приватного SSH-ключа с помощью `ssh-keygen -lf`.
 *
 * Используется для идентификации ключа перед проверкой его наличия в агенте.
 *
 * @param key - Путь к приватному SSH-ключу.
 * @param context - Контекст выполнения (включая поддержку WSL2).
 * @returns Отпечаток ключа в формате, выводимом `ssh-keygen`.
 * @throws Ошибка, если не удалось получить или распарсить вывод.
 *
 * @since 0.4.0
 *
 **/
export async function getFingerprintAsync(
  key: string,
  context: AuthContext
): Promise<string> {

  const response = await context.runAsync(
    'ssh-keygen',
    ['-lf', key]
  )

  const output = response.stdout.trim()

  if (!output)
    throw new Error('No data from ssh-keygen')

  const fingerprint = output.split(' ')[1]

  if (!fingerprint)
    throw new Error('No fingerprint in ssh-keygen output')

  return fingerprint

}

/**
 * Проверяет, добавлен ли SSH-ключ в агент.
 *
 * Сравнивает отпечаток ключа с отпечатками, возвращёнными `ssh-add -l`.
 *
 * @param path - Путь к приватному SSH-ключу.
 * @param context - Контекст выполнения.
 * @returns `true`, если ключ найден в агенте, иначе `false`.
 *
 * @since 0.4.0
 *
 **/
export async function hasKeyAsync(path: KeyPath, context: AuthContext): Promise<boolean> {

  const fingerprint = await getFingerprintAsync(path, context)

  return await hasEntryAsync(fingerprint, context)

}

/**
 * Добавляет приватный SSH-ключ в SSH-агент.
 *
 * Использует `ssh-add` с опциональным временем жизни (`-t`) из контекста.
 * Вывод команды передаётся в терминал для отображения подсказок (например, ввод пароля).
 *
 * @param path - Путь к приватному ключу.
 * @param context - Контекст выполнения.
 * @throws Ошибка, если команда завершилась с кодом, отличным от 0.
 *
 * @since 0.4.0
 *
 **/
export async function addKeyAsync(path: KeyPath, context: AuthContext): Promise<void> {

  const args = ['-q']

  if (context.ttl)
    args.push('-t', context.ttl)

  args.push(
    expandHomeDir(path)
  )

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

  logger.debug('SSH key added to ssh-agent')

}
