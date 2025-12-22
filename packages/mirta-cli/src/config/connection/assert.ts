import { isNumber, isString } from '@mirta/basics'
import type { MirtaConnection } from '../types'

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
export function assertConnectionIsValid(
  value: Record<string, unknown>
): asserts value is MirtaConnection {

  if (value.type !== 'ssh')
    throw new Error(`Only SSH connection type supported`)

  if (value.username !== undefined && (!isString(value.username) || value.username.trim() === ''))
    throw new Error(`username must be a non-empty string`)

  if (value.hostname === undefined || !isString(value.hostname))
    throw new Error(`hostname is required and must be a string`)

  if (value.port !== undefined) {

    const port = isString(value.port)
      ? parseInt(value.port, 10)
      : value.port

    if (!isNumber(port) || !Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error(`port must be integer between 1 and 65535, got ${JSON.stringify(value.port)}`)

  }

  if (value.pkcs11 !== undefined && !isString(value.pkcs11))
    throw new Error(`pkcs11: path to identity must be a string`)

  if (value.key !== undefined && !isString(value.key))
    throw new Error(`key: path to identity must be a string`)

  if (value.ttl !== undefined) {

    if (!isString(value.ttl))
      throw new Error(`ttl must be a string`)

    if (!SSH_TIME_PATTERN.test(value.ttl.trim()))
      throw new Error(`ttl must be in format <number>[smhd]`)

  }

  if (value.wsl !== undefined && !isString(value.wsl))
    throw new Error(`wsl: distro name must be a string`)

}
