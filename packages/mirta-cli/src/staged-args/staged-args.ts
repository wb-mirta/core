/**
 * Модуль для поэтапного разбора аргументов командной строки
 * с поддержкой типизации, валидации и подсказок.
 *
 * Позволяет обрабатывать опции, позиционные аргументы и терминатор `--`,
 * с возможностью многоэтапного парсинга.
 *
 * @fileDescription
 *
 **/

import { parseArgs } from 'node:util'
import { suggestClosest } from '@mirta/basics/fuzzy'
import { t } from '#src/i18n'
import type {
  OptionToken,
  Token,
  Option,
  OptionSchema,
  Values,
  ParseResult,
  FinalParseResult,
  StagedArgs
} from './types'

/**
 * Проверяет, что все опции в токенах известны. Если нет — формирует ошибку с подсказками.
 *
 * @param tokens - Список токенов.
 * @param knownArgs - Список известных имён опций и их коротких алиасов.
 * @throws Ошибка с перечислением неизвестных опций и предложениями по исправлению.
 *
 * @since 0.4.0
 *
 **/
function assertKnownArgsOnly(
  tokens: readonly Token[],
  knownArgs: readonly string[]
): void {

  const unknownOptionTokens = tokens.filter(x => x.kind === 'option')

  if (unknownOptionTokens.length === 0)
    return

  const errorOptions = unknownOptionTokens.map((token) => {

    const name = token.name

    const suggestion = name.length > 1
      ? suggestClosest(name, knownArgs)
      : undefined

    if (suggestion)
      return t('args.suggest', {
        input: token.rawName,
        suggestion: `--${suggestion}`,
      })

    return token.rawName

  })

  throw new Error(`${t('args.notFound', { count: errorOptions.length })}: ${errorOptions.join(', ')}`)

}

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

  const result: Record<string, Option & { key: string } | undefined> = {}

  for (const key of Object.keys(schema)) {

    const option = schema[key]

    if (result[key])
      throw new Error(`Schema: duplicate argument '--${key}'`)

    const expanded = { ...option, key }

    result[key] = expanded

    if (option.short) {

      if (result[option.short])
        throw new Error(`Schema: duplicate argument alias '-${option.short}'`)

      result[option.short] = expanded

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
function mapToSchema(
  schema: OptionSchema,
  tokens: readonly Token[],
  consumedIndices: readonly number[]
) {

  const values: Record<string, string | boolean> = {}
  const positionals: string[] = []

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

    if (token.kind !== 'option' || !token.name)
      continue

    const option = expandedSchema[token.name]

    if (!option)
      continue

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
    if (foundKeys.has(key) && schema[key].type === 'string')
      throw Error(`Missing value for '--${key}' option`)

    // Для отсутствующих ключей применяем значения по умолчанию.
    if (schema[key].default !== undefined) {

      values[key] = schema[key].default
      continue

    }

  }

  return {
    values,
    positionals,
    consumedIndices: [...localConsumedIndices],
  }

}

/**
 * Дополняет список известных аргументов именами из новой схемы.
 *
 * @param knownArgs - Текущий список известных имён.
 * @param schema - Новая схема опций.
 * @returns Обновлённый список имён, включая длинные и короткие имена из схемы.
 *
 * @since 0.4.0
 *
 **/
function extendKnownArgs(knownArgs: readonly string[], schema: OptionSchema) {

  const knownSet = new Set(knownArgs)

  const result = [...knownArgs] // копируем уже известные

  for (const key of Object.keys(schema)) {

    if (!knownSet.has(key)) {

      result.push(key)
      knownSet.add(key)

    }

    const short = schema[key].short

    if (short && !knownSet.has(short)) {

      result.push(short)
      knownSet.add(short)

    }

  }

  return result

}

/**
 * Создаёт экземпляр `StagedArgs` с заданными параметрами.
 *
 * @param args - Массив аргументов командной строки.
 * @param mergedSchema - Объединённая схема опций с предыдущих стадий.
 * @param knownArgs - Список уже известных имён опций.
 * @param consumedIndices - Индексы токенов, уже обработанных ранее.
 * @returns Объект `StagedArgs` с методами `parse` и `parseFinal`.
 *
 * @since 0.4.0
 *
 **/
function createStage(
  args: string[],
  mergedSchema: OptionSchema = {},
  knownArgs: readonly string[] = [],
  consumedIndices: readonly number[] = []
): StagedArgs {

  const parse = <TSchema extends OptionSchema>(
    schema: TSchema
  ): ParseResult<TSchema> => {

    // 1. Объединяем схемы для parseArgs
    const stagedSchema = { ...mergedSchema, ...schema }

    // 2. Токенизируем с полным контекстом
    const { tokens } = parseArgs({
      args,
      options: stagedSchema,
      tokens: true,
      strict: false,
      allowPositionals: true,
    })

    const currentKnownArgs = extendKnownArgs(knownArgs, schema)

    const {
      values,
      positionals,
      consumedIndices: localConsumedIndices,
    } = mapToSchema(schema, tokens, consumedIndices)

    const stagedArgs = createStage(args, stagedSchema, currentKnownArgs, localConsumedIndices)

    return {
      values: values as Values<TSchema>,
      positionals,
      stagedArgs,
    }

  }

  const parseFinal = <TSchema extends OptionSchema>(
    schema: TSchema
  ): FinalParseResult<TSchema> => {

    // 1. Объединяем схемы для parseArgs
    const stagedSchema = { ...mergedSchema, ...schema }

    // 2. Токенизируем с полным контекстом
    const { tokens } = parseArgs({
      args,
      options: stagedSchema,
      tokens: true,
      strict: false,
      allowPositionals: true,
    })

    const currentKnownArgs = extendKnownArgs(knownArgs, schema)

    // Находим незадействованные опции.
    const unknownTokens = tokens.filter(
      (token): token is OptionToken =>
        token.kind === 'option'
        && !currentKnownArgs.includes(token.name)
    )

    assertKnownArgsOnly(unknownTokens, currentKnownArgs)

    const { values, positionals } = mapToSchema(schema, tokens, consumedIndices)

    return {
      values: values as Values<TSchema>,
      positionals,
    }

  }

  return { parse, parseFinal }

}

/**
 * Создаёт начальный экземпляр `StagedArgs` для разбора аргументов командной строки.
 *
 * @param args - Массив строк, представляющих аргументы (например, `process.argv.slice(2)`).
 * @returns Объект для поэтапного разбора аргументов.
 *
 * @example
 * const staged = createStagedArgs(process.argv.slice(2));
 * const { values, stagedArgs } = staged.parse(globalSchema);
 * const { values: cmdValues } = stagedArgs.parseFinal(commandSchema);
 *
 * @since 0.4.0
 *
 **/
export function createStagedArgs(args: string[]): StagedArgs {

  return createStage(args)

}
