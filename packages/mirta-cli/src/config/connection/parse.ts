import { t } from '#src/i18n'
import { replaceEnvVars } from '#src/utils/env'
import { logger } from '#utils/logger'

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
function splitByFirstOccurrence(
  input: string,
  separator: string
): [string, ...(string | undefined)[]] {

  const index = input.indexOf(separator)

  if (index === -1)
    return [input]

  return [input.slice(0, index), input.slice(index + separator.length)]

}

/**
 * Парсит строку подключения в структурированный объект.
 *
 * Формат строки:
 * ```txt
 * protocol://user@host:port;param1=value1;param2=value2
 * ```
 * Извлекает:
 * - Протокол, имя пользователя, хост, порт из URL-части
 * - Дополнительные параметры из пар ключ=значение после точки с запятой:
 *   `pkcs11`, `key`, `ttl`, `wsl`
 *
 * Выполняет подстановку переменных окружения в формате ${VAR_NAME}.
 *
 * @param input - Строка подключения
 * @returns Объект с распарсенными полями (требует последующей валидации)
 * @throws Ошибка при невалидном URL или пустой строке
 *
 * @since 0.4.0
 *
 **/
export function parseConnectionString(input: string): Record<string, unknown> {

  const source = replaceEnvVars(input).trim()

  if (source === '')
    throw new Error('Empty connection string')

  const parts = source.split(';')

  // === 1. Основные параметры ===

  let url: URL

  try {

    url = new URL(parts[0])

  }
  catch {

    throw new Error(`Invalid connection URL: "${parts[0]}"`)

  }

  const protocol = url.protocol.replace(':', '')

  const result: Record<string, unknown> = {
    type: protocol,
    username: decodeURIComponent(url.username),
    hostname: url.hostname,
  }

  if (url.port !== '')
    result.port = url.port

  // === 2. Вспомогательные опции ===

  const params = parts.slice(1).reduce<Record<string, string | undefined>>((items, nextItem) => {

    const [key, value] = splitByFirstOccurrence(nextItem, '=')

    if (key) {

      if (value !== undefined) {

        items[key] = value

      }
      else {

        logger.warn(t('connection.emptyParameterSkipped', { key }))

      }

    }

    return items

  }, {})

  result.pkcs11 = params.pkcs11
  result.key = params.key
  result.ttl = params.ttl

  if (result.ttl && !result.pkcs11 && !result.key)
    logger.warn(t('connection.ttlSkipped'))

  result.wsl = params.wsl

  return result

}
