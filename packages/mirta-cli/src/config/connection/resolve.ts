import type { MirtaConfig, MirtaConnection } from '../types'
import { DEFAULT_SSH_USERNAME } from '../constants'
import { replaceEnvVars } from '#src/utils/env'
import { isNumber, isString } from '@mirta/basics'
import { assertConnectionIsValid } from './assert'
import { parseConnectionString } from './parse'

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

  let connection: string | Record<string, unknown> | undefined

  // Явная строка с протоколом
  if (/^(?:[\w]+\+)?[\w]+:\/\//.test(inputNorm)) {

    connection = inputNorm

  }
  // Имя подключения из набора config.connections
  else if (config.connections && inputNorm in config.connections) {

    connection = config.connections[inputNorm]

  }

  if (!connection)
    throw new Error(`Connection "${input}" not found`)

  // Если строка — парсим в объект
  if (isString(connection))
    connection = parseConnectionString(connection)

  if (connection.username === '' || connection.username === undefined)
    connection.username = DEFAULT_SSH_USERNAME

  if (connection.ttl && isNumber(connection.ttl))
    connection.ttl = connection.ttl.toString()

  if (connection.port === '')
    connection.port = undefined

  assertConnectionIsValid(connection)

  return connection

}
