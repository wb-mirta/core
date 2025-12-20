import type { MirtaConfig, MirtaConnection, WslDistroName, Pkcs11Path, KeyPath, TimeToLive } from './types'
import { DEFAULT_SSH_USERNAME, DEFAULT_SSH_PORT } from './constants'
import { replaceEnvVars } from '#src/utils/env'
import { isString } from '@mirta/basics'
import { useLogger } from '#src/utils/logger'

/**
 * Проверяет, является ли строка корректным временем в формате OpenSSH.
 *
 * Разрешены:
 * - Чистые числа: `600` → 600 секунд
 * - Последовательности с квалификаторами: `10m`, `1h30m`, `2d1w`
 *
 * Запрещены:
 * - `1h30` (без квалификатора у `30`) → потенциальная ошибка
 * - `30x`, `m`, `abc`
 *
 * @since 0.4.0
 *
 **/
const SSH_TIME_PATTERN = /^(?:\d+[smhdw])+$|^\d+$/i

const logger = useLogger()

export function getConnectionTarget(connection: MirtaConnection) {

  let target = `${connection.username}@${connection.hostname}`

  if (connection.port && connection.port !== DEFAULT_SSH_PORT)
    target += `:${connection.port}`

  return target

}

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

function splitByFirstOccurrence(input: string, separator: string): string[] {

  const index = input.indexOf(separator)

  if (index === -1)
    return [input]

  return [input.slice(0, index), input.slice(index + separator.length)]

}

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

export function resolveConnection(
  config: MirtaConfig,
  input = 'default'
): MirtaConnection {

  const inputNorm = replaceEnvVars(input)

  let connection: string | MirtaConnection | undefined

  // Строки с указанным протоколом - явные подключения.
  if (/^(?:[\w]+\+)?[\w]+:\/\//.test(inputNorm)) {

    connection = inputNorm

  }
  else if (config.connections && inputNorm in config.connections) {

    connection = config.connections[inputNorm]

  }

  if (isString(connection))
    connection = parseConnectionString(connection)

  if (connection) {

    connection.username ??= DEFAULT_SSH_USERNAME

    assertConnectionIsValid(connection)

    return connection

  }

  throw new Error(`Connection key "${input}" not found.`)

}
