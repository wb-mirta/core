import { SchemaError } from './errors/schema'
import { ResultHandler } from './result'
import type { OptionSchema, Option, Token, ParseError } from './types'

/**
 * Расширяет схему, добавляя ссылки на исходный ключ и проверяя дубликаты.
 *
 * @param schema - Исходная схема опций.
 * @returns Расширенная схема, где каждая опция содержит свой `key` и доступна по короткому имени.
 * @throws Ошибка при обнаружении дубликатов имён или алиасов.
 *
 * @since 0.4.0
 *
 **/
function expandSchema(schema: OptionSchema) {

  const result: Record<string, Option & { key: string }> = {}

  for (const key of Object.keys(schema)) {

    // Может задвоиться через short, когда длина 1 символ
    if (key in result)
      throw SchemaError.get('duplicateName', key, result[key].key)

    const option = { ...schema[key], key }

    result[key] = option

    if (option.short) {

      // Может повториться в разных опциях
      if (option.short in result)
        throw SchemaError.get('duplicateName', option.short, result[option.short].key)

      result[option.short] = option

    }

  }

  return result

}

/**
 * Сопоставляет токены с опциями по схеме и извлекает значения.
 *
 * @param schema - Схема опций.
 * @param tokens - Разобранные токены.
 * @param consumedIndices - Индексы токенов, уже обработанных на предыдущих стадиях.
 * @returns Объект с значениями опций, позиционными аргументами и обновлённым списком потреблённых индексов.
 * @throws Ошибка, если строковой опции не задано значение и нет значения по умолчанию.
 *
 * @since 0.4.0
 *
 **/
export function mapToSchema(
  schema: OptionSchema,
  tokens: readonly Token[],
  consumedIndices: readonly number[] = []
) {

  const values: Record<string, string | boolean> = {}
  const positionals: string[] = []
  const errors: ParseError[] = []

  const expandedSchema = expandSchema(schema)
  const localConsumedIndices = new Set(consumedIndices)

  const foundKeys = new Set<string>()
  let nextIndex = 0

  for (let i = 0; i < tokens.length; i++) {

    const token = tokens[i]
    nextIndex = i + 1

    if (token.kind === 'positional') {

      if (localConsumedIndices.has(i))
        continue

      positionals.push(token.value)

    }

    if (token.kind !== 'option' || !token.name || !(token.name in expandedSchema))
      continue

    const option = expandedSchema[token.name]

    foundKeys.add(option.key)

    if (option.type === 'boolean') {

      values[option.key] = token.value !== 'false'

    }
    else {

      let value: string | undefined

      if (token.value !== undefined) {

        value = token.value

      }
      else if (nextIndex < tokens.length) {

        const nextToken = tokens[nextIndex]

        if (nextToken.kind === 'positional') {

          value = nextToken.value
          localConsumedIndices.add(nextIndex)

        }

      }

      if (value !== undefined)
        values[option.key] = value

    }

  }

  for (const key of Object.keys(schema)) {

    // Пропускаем явно установленные значения.
    if (key in values)
      continue

    // Строковые опции можно указывать только вместе со значениями.
    if (foundKeys.has(key) && schema[key].type === 'string') {

      errors.push({ type: 'missing-value', option: key })
      continue

    }

    // Для отсутствующих ключей применяем значения по умолчанию.
    if (schema[key].default !== undefined) {

      values[key] = schema[key].default
      continue

    }

  }

  return errors.length > 0
    ? ResultHandler.failed(errors)
    : ResultHandler.ok({
        values,
        positionals,
        consumedIndices: [...localConsumedIndices],
      })

}
