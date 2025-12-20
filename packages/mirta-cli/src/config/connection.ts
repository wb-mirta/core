import type { MirtaConfig, MirtaConnection, WslDistroName, Pkcs11Path, KeyPath, TimeToLive } from './types'
import { DEFAULT_SSH_USERNAME } from './constants'
import { replaceEnvVars } from '#src/utils/env'
import { isString } from '@mirta/basics'
import { useLogger } from '#src/utils/logger'

/**
 * Регулярное выражение для проверки формата времени в стиле OpenSSH.
 *
 * Разрешает:
 * - Чистые числа: `600` (секунды)
 * - С последовательностями: `10m`, `1h30m`, `2d`
 *
 * Запрещает: `1h30`, `30x`, `m`, `abc`.
 *
 * Используется для валидации параметра `ttl`.
 *
 * @since 0.4.0
 *
 **/
const SSH_TIME_PATTERN = /^(?:\d+[smhdw])+$|^\d+$/i

const logger = useLogger()

/**
 * Формирует строку назначения подключения в формате `user@host[:port]`.
 *
 * Порт включается только если отличается от стандартного (22).
 *
 * @param connection - Объект подключения.
 * @returns Строка вида `user@host` или `user@host:port`.
 *
 **/
export function getConnectionTarget(connection: MirtaConnection) {

  let target = `${connection.username}@${connection.hostname}`

  if (connection.port && connection.port !== 22)
    target += `:${connection.port}`

  return target

}

/**
 * Утверждает, что переданный объект является валидным `MirtaConnection`.
 *
 * Проверяет все поля на корректность типов и допустимые значения.
 * При неудаче выбрасывает `Error` с описанием проблемы.
 *
 * Используется для runtime-валидации конфигурации.
 *
 * @param value - Частичный объект подключения.
 * @throws Ошибка, если объект не проходит валидацию.
 *
 * @since 0.4.0
 *
 **/
export function assertConnectionIsValid(value: Partial<MirtaConnection>): asserts value is MirtaConnection {

  if (value.type !== 'ssh')
    throw new Error(`Only SSH connection type supported`)

  if (!value.hostname || !isString(value.hostname))
    throw new Error(`hostname is required and must be a string`)

  if (value.port !== undefined) {

    if (typeof value.port !== 'number' || !Number.isInteger(value.port) || value.port < 1 || value.port > 65535)
      throw new Error(`port must be integer between 1 and 65535, got: ${value.port}`)

  }

  if (value.username !== undefined && (!isString(value.username) || value.username.trim() === ''))
    throw new Error(`username must be a non-empty string`)

  if (value.pkcs11 && !isString(value.pkcs11))
    throw new Error(`pkcs11: path to identity must be a string`)

  if (value.key && !isString(value.key))
    throw new Error(`key: path to identity must be a string`)

  if (value.ttl) {

    if (!isString(value.ttl))
      throw new Error(`ttl must be a string`)

    if (!SSH_TIME_PATTERN.test(value.ttl.trim()))
      throw new Error(`ttl must be in format <number>[smhd]`)

  }

  if (value.wsl && !isString(value.wsl))
    throw new Error(`wsl: distro name must be a string`)

}

/**
 * Разделяет строку по первому вхождению указанного разделителя.
 *
 * @param input - Входная строка.
 * @param separator - Разделитель.
 * @returns Массив из двух элементов: до и после разделителя. Если разделитель не найден — возвращает `[input]`.
 *
 * @since 0.4.0
 *
 **/
function splitByFirstOccurrence(input: string, separator: string): string[] {

  const index = input.indexOf(separator)

  if (index === -1)
    return [input]

  return [input.slice(0, index), input.slice(index + separator.length)]

}

/**
 * Парсит строку подключения в формате:
 *
 *   protocol://user@host:port;param1=value1;param2=value2
 *
 * Поддерживает:
 * - Протокол (на данный момент только `ssh`)
 * - Пользователя, хост, порт из URL
 * - Дополнительные параметры: pkcs11, key, ttl, wsl
 * - Подстановку переменных окружения: ${VAR_NAME}
 *
 * @param input - Строка подключения.
 * @returns Объект `MirtaConnection`.
 * @throws Ошибка при невалидном URL или пустой строке.
 *
 * @since 0.4.0
 *
 **/
export function parseConnectionString(input: string): MirtaConnection {

  const source = replaceEnvVars(input).trim()

  if (source === '')
    throw new Error('Empty connection string')

  const parts = source.split(';')

  let url: URL

  try {

    url = new URL(parts[0])

  }
  catch {

    throw new Error(`Invalid connection URL: "${parts[0]}"`)

  }

  const protocol = url.protocol.replace(':', '')

  const result: MirtaConnection = {
    type: protocol,
    hostname: url.hostname,
    port: url.port ? parseInt(url.port, 10) : undefined,
    username: decodeURIComponent(url.username),
  }

  const params = parts.slice(1).reduce<Record<string, string | undefined>>((items, nextItem) => {

    const [key, value] = splitByFirstOccurrence(nextItem, '=')

    if (key && value)
      items[key] = value

    return items

  }, {})

  result.pkcs11 = params.pkcs11 as Pkcs11Path
  result.key = params.key as KeyPath
  result.ttl = params.ttl as TimeToLive

  if (result.ttl && !result.pkcs11 && !result.key)
    logger.warn('No pkcs11 or key specified — ttl will be ignored')

  result.wsl = params.wsl as WslDistroName

  return result

}

/**
 * Разрешает имя подключения в полный объект `MirtaConnection`.
 *
 * Поддерживает:
 * - Прямые строки с URL (например, `ssh://...`)
 * - Ссылки на имена из `config.connections`
 * - Подстановку переменных окружения
 *
 * Если соединение найдено, применяет значение по умолчанию для `username` и проверяет валидность.
 *
 * @param config - Конфигурация проекта.
 * @param input - Имя подключения или строка с URL (по умолчанию `'default'`).
 * @returns Полный объект подключения.
 * @throws Ошибка, если подключение не найдено или невалидно.
 *
 * @since 0.4.0
 *
 **/
export function resolveConnection(
  config: MirtaConfig,
  input = 'default'
): MirtaConnection {

  const inputNorm = replaceEnvVars(input)

  let connection: string | MirtaConnection | undefined

  // Явная строка с протоколом
  if (/^(?:[\w]+\+)?[\w]+:\/\//.test(inputNorm)) {

    connection = inputNorm

  }
  // Или ссылка на имя в config.connections
  else if (config.connections && inputNorm in config.connections) {

    connection = config.connections[inputNorm]

  }

  // Если строка — парсим в объект
  if (isString(connection))
    connection = parseConnectionString(connection)

  if (connection) {

    connection.username ??= DEFAULT_SSH_USERNAME

    assertConnectionIsValid(connection)

    return connection

  }

  throw new Error(`Connection key "${input}" not found.`)

}
