import { ExecutionResult, OperationCanceledError, STDIO_CAPTURE_ERRORS, STDIO_CAPTURE_OUTPUT, STDIO_PIPED } from '#utils/shell'
import { AuthContext } from '#auth/types'
import { t } from '#i18n'
import { logger } from '#utils/logger'
import { prompts } from '#utils/prompts'
import chalk from 'chalk'
import { SSH_DIR } from '#auth/constants'

/**
 * Приоритетные типы SSH-ключей, используемые при выборе ключа хоста.
 *
 * Определяет порядок предпочтения: от наиболее безопасного и современного к устаревшему.
 * Используется для выбора одного ключа, если хост предоставляет несколько.
 *
 * @since 0.4.5
 *
 **/
const HOST_KEY_PRIORITY = [
  'ssh-ed25519',
  'ecdsa-sha2-nistp256',
  'ssh-rsa',
] as const

/**
 * Тип, представляющий допустимые алгоритмы публичных ключей SSH.
 * Является строгим перечислением на основе массива {@link HOST_KEY_PRIORITY}.
 *
 * @since 0.4.5
 *
 **/
type HostKeyType = typeof HOST_KEY_PRIORITY[number]

/**
 * Интерфейс, описывающий информацию об открытом ключе удалённого SSH-хоста.
 *
 * @since 0.4.5
 *
 **/
interface HostKey {

  /**
   * Алгоритм криптографического ключа.
   *
   **/
  type: HostKeyType

  /**
   * Полная строка записи ключа в формате, возвращаемом `ssh-keyscan`.
   * Содержит имя хоста, тип ключа и его значение.
   *
   **/
  entry: string

  /**
   * Отпечаток ключа в формате `SHA256:...`.
   * Отображается пользователю для проверки подлинности хоста.
   *
   **/
  fingerprint: string

}

/**
 * Проверяет, содержит ли локальный файл `known_hosts` запись для указанного хоста.
 * Использует утилиту `ssh-keygen -F <hostname>`, которая безопасно ищет хост без подключения.
 *
 * @param context - Контекст аутентификации, содержащий имя хоста и метод выполнения команд.
 * @returns `true`, если хост найден в `~/.ssh/known_hosts`, иначе `false`.
 *
 * @remarks
 * Ошибки выполнения команды интерпретируются как отсутствие записи.
 * Подходит для использования перед установлением SSH-соединения.
 *
 * @since 0.4.5
 *
 **/
export async function hasKnownHostAsync(context: AuthContext) {

  try {

    const response = await context.runAsync('ssh-keygen', ['-F', context.hostname], {
      stdio: STDIO_CAPTURE_OUTPUT,
    })

    return response.stdout.length > 0

  }
  catch {

    return false

  }

}

/**
 * Получает публичные ключи удалённого хоста с помощью `ssh-keyscan` и выбирает наиболее приоритетный.
 * Поддерживает несколько типов ключей и выбирает первый по списку приоритетов.
 * Для выбранного ключа вычисляется отпечаток с помощью `ssh-keygen -lf`.
 *
 * @param context - Контекст аутентификации.
 * @returns Объект `HostKey`, содержащий тип, запись и отпечаток ключа, или `undefined`, если ключи недоступны.
 *
 * @remarks
 * - Пропускает комментарии (строки с `#`) и невалидные записи.
 * - Возвращает первый ключ по порядку приоритета.
 *
 * @since 0.4.5
 *
 **/
export async function fetchHostKeyAsync(
  context: AuthContext
): Promise<HostKey | undefined> {

  let result: ExecutionResult | undefined

  try {

    result = await context.runAsync('ssh-keyscan', [
      // Приоритет ключей
      '-t', HOST_KEY_PRIORITY.join(','),
      // Хэшировать хост, таймаут выполнения 5 секунд
      '-HT5',
      // Сканируемый хост
      context.hostname,
    ])

  }
  catch {

    return

  }

  const entries = result.stdout.trim().split('\n').filter(Boolean)
  const keys: HostKey[] = []

  for (const entry of entries) {

    if (entry.startsWith('#'))
      continue

    const [host, type, key] = entry.split(/\s+/) as [string, HostKeyType | undefined, string]

    if (!host || !type || !key)
      continue

    if (!HOST_KEY_PRIORITY.includes(type))
      continue

    const fingerprintResult = await context.runAsync(
      'ssh-keygen', ['-lf', '-'], {
        stdio: STDIO_PIPED,
        input: `${type} ${key}`,
      })

    const fingerprint = fingerprintResult
      .stdout.trim().split(/\s+/)[1] as string | undefined

    if (!fingerprint?.startsWith('SHA256:'))
      continue

    keys.push({ type, entry, fingerprint })

  }

  keys.sort((a, b) =>
    HOST_KEY_PRIORITY.indexOf(a.type) - HOST_KEY_PRIORITY.indexOf(b.type)
  )

  return keys[0]

}

/**
 * Добавляет запись о публичном ключе хоста в локальный файл `~/.ssh/known_hosts`.
 * Использует утилиту `tee` с флагом `-a` для добавления строки в конец файла.
 *
 * @param key - Объект {@link HostKey}, содержащий запись ключа.
 * @param context - Контекст аутентификации.
 * @returns Промис, который завершается после попытки записи.
 *
 * @remarks
 * Запись добавляется с символом перевода строки (`\n`) для корректного форматирования файла.
 * Ошибки записи (например, нет прав) не прерывают выполнение, но могут быть добавлены в будущем.
 *
 * @since 0.4.5
 *
 **/
export async function addToKnownHostsAsync(
  key: HostKey,
  context: AuthContext
): Promise<void> {

  await context.runAsync('mkdir', ['-p', SSH_DIR], {
    stdio: STDIO_CAPTURE_ERRORS,
  })

  await context.runAsync('tee', ['-a', `${SSH_DIR}/known_hosts`], {
    stdio: STDIO_PIPED,
    input: `${key.entry}\n`,
  })

}

/**
 * Полностью управляет процессом подтверждения доверия к SSH-хосту.
 * Проверяет, известен ли хост; если нет — получает ключ, показывает отпечаток и запрашивает подтверждение.
 * При положительном ответе добавляет хост в `known_hosts`.
 *
 * @param context - Контекст аутентификации.
 * @returns Промис, который завершается успешно при доверии или выбрасывает {@link OperationCanceledError} при отказе.
 *
 * @throws {OperationCanceledError} — если пользователь отказался доверять хосту.
 * @throws {Error} — если не удалось получить публичный ключ хоста.
 *
 * @remarks
 * Является фасадом для {@link hasKnownHostAsync}, {@link fetchHostKeyAsync} и {@link addToKnownHostsAsync}.
 * Использует интерактивный ввод через {@link prompts}.
 *
 * @since 0.4.5
 *
 **/
export async function confirmHost(context: AuthContext) {

  if (await hasKnownHostAsync(context))
    return

  const hostKey = await fetchHostKeyAsync(context)

  if (!hostKey)
    throw new Error('Unable to fetch host public key')

  logger.warn([
    t('ssh.hostUntrusted', { hostname: context.hostname }) + '\n',
    t('ssh.keyType', { type: hostKey.type }) + '\n',
    t('ssh.fingerprint', { fingerprint: hostKey.fingerprint }),
  ])

  const { canAddToKnown } = await prompts({
    type: 'toggle',
    name: 'canAddToKnown',
    message: chalk.red(t('ssh.confirmHostIsTrusted')),
    initial: false,
    active: t('yes'),
    inactive: t('no'),
  }) as { canAddToKnown: boolean }

  if (!canAddToKnown)
    throw new OperationCanceledError()

  await addToKnownHostsAsync(hostKey, context)

}
