/**
 * Утилита для итеративного (поэтапного) парсинга аргументов командной строки.
 *
 * Позволяет обрабатывать аргументы по схемам на разных уровнях:
 * - сначала глобальные флаги (--verbose, --config),
 * - затем — аргументы конкретной команды.
 *
 * Поддерживает:
 * - короткие и длинные опции (--help, -h),
 * - значения опций (--port 3000),
 * - позиционные аргументы,
 * - разделитель `--`,
 * - проверку неизвестных опций с подсказками.
 *
 * @example
 * ```ts
 * const args = createStagedArgs(process.argv.slice(2))
 *
 * const { values: globals, stagedArgs } = args.parse({
 *   verbose: { type: 'boolean' },
 *   config: { type: 'string' }
 * })
 *
 * const { values: command } = stagedArgs.parseFinal({
 *   force: { type: 'boolean' }
 * })
 * ```
 *
 * @file
 *
 * @since 0.4.0
 *
 **/

import { parseArgs } from 'node:util'
import { suggestClosest } from '@mirta/basics/fuzzy'
import { t } from '../i18n'

/**
 * Внутреннее представление опции в списке аргументов.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
type OptionToken
  = | { kind: 'option', index: number, name: string, rawName: string, value: string, inlineValue: boolean }
    | { kind: 'option', index: number, name: string, rawName: string, value: undefined, inlineValue: undefined }

/**
 * Токенизированное представление аргумента командной строки.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
type Token
  = | OptionToken
    | { kind: 'positional', index: number, value: string }
    | { kind: 'option-terminator', index: number }

type Option
  = | { type: 'boolean', short?: string, default?: boolean }
    | { type: 'string', short?: string, default?: string }

/**
 * Схема описания опций командной строки.
 *
 * Ключ — имя опции, значение — её тип и метаданные.
 *
 * @example
 * ```ts
 * const schema = {
 *   help: { type: 'boolean', short: 'h' },
 *   port: { type: 'string' }
 * }
 * ```
 * @since 0.4.0
 *
 **/
export type OptionSchema = Record<string, Option>

/**
 * Выводимый тип значений на основе схемы.
 *
 * Преобразует схему в объект с соответствующими типами:
 * - строковые опции → `string | undefined`
 * - булевы опции → `boolean`
 *
 * @since 0.4.0
 *
 **/
type Values<TSchema extends OptionSchema> = {

  [K in keyof TSchema]: TSchema[K]['type'] extends 'string'
    ? string | undefined
    : TSchema[K]['type'] extends 'boolean'
      ? boolean
      : never

}

/**
 * Результат парсинга по схеме, позволяющий продолжить обработку оставшихся аргументов.
 *
 * @typeparam TSchema — тип схемы, по которой был произведён парсинг
 *
 * @since 0.4.0
 *
 **/
interface ParseResult<TSchema extends OptionSchema> {

  /**
   * Значения, извлечённые по указанной схеме.
   *
   **/
  values: Values<TSchema>

  /**
   * Позиционные аргументы, оставшиеся после парсинга.
   *
   **/
  positionals: string[]

  /**
   * Объект для продолжения парсинга аргументов.
   *
   * Содержит те же токены, но с обновлённым контекстом:
   * - известные опции учтены,
   * - можно безопасно вызывать `.parse()` или `.parseFinal()`.
   *
   **/
  stagedArgs: StagedArgs

}

/**
 * Финальный результат парсинга.
 *
 * Используется при завершающем этапе, когда все опции должны быть известны.
 * Неизвестные опции приводят к ошибке.
 *
 * @typeparam TSchema — тип схемы, по которой был произведён парсинг
 *
 * @since 0.4.0
 *
 **/
interface FinalParseResult<TSchema extends OptionSchema> {

  /**
   * Значения, извлечённые по указанной схеме.
   **/
  values: Values<TSchema>

  /**
   * Позиционные аргументы, оставшиеся после парсинга.
   *
   **/
  positionals: string[]

}

/**
 * Интерфейс для итеративного парсинга аргументов командной строки.
 *
 * Позволяет:
 * - разбирать аргументы по частям (глобальные флаги → команда),
 * - получать оставшиеся аргументы для следующего этапа,
 * - проверять неизвестные опции с подсказками.
 *
 * Создаётся с помощью {@link createStagedArgs}.
 *
 * @since 0.4.0
 *
 **/
export interface StagedArgs {

  /**
   * Разбирает аргументы по указанной схеме.
   *
   * Неизвестные опции **не вызывают ошибки** — они остаются доступными
   * для последующих этапов парсинга.
   *
   * @param schema Описание опций для текущего этапа
   * @returns Результат с извлечёнными значениями и объектом для продолжения
   *
   * @example
   * ```ts
   * const { values, stagedArgs } = args.parse({
   *   verbose: { type: 'boolean' }
   * })
   * ```
   **/
  parse<TSchema extends OptionSchema>(
    schema: TSchema
  ): ParseResult<TSchema>

  /**
   * Разбирает аргументы по указанной схеме и **проверяет оставшиеся опции**.
   *
   * Если обнаружены неизвестные опции — выбрасывается ошибка
   * с подсказками (если есть похожие имена).
   *
   * Используется на финальном этапе парсинга.
   *
   * @param schema Описание опций для финальной проверки
   * @returns Результат с извлечёнными значениями
   *
   * @example
   * ```ts
   * const { values } = stagedArgs.parseFinal({
   *   force: { type: 'boolean' }
   * })
   * ```
   **/
  parseFinal<TSchema extends OptionSchema>(
    schema: TSchema
  ): FinalParseResult<TSchema>

}

/**
 * Проверяет токены на наличие неизвестных опций и выбрасывает ошибку с подсказками.
 *
 * @param tokens Список токенов для проверки
 * @param knownArgs Список допустимых имён опций
 * @throws Ошибка с сообщением и возможными подсказками
 *
 * @since 0.4.0
 *
 * @internal
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
 * Расширяет схему, добавляя короткие опции как ключи.
 *
 * Позволяет обращаться к опции и по короткому, и по длинному имени.
 *
 * @param schema Исходная схема
 * @returns Расширенная схема с короткими именами
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
function expandSchema(schema: OptionSchema) {

  const result: Record<string, Option & { key: string } | undefined> = {}

  for (const key of Object.keys(schema)) {

    const option = schema[key]
    const expanded = { ...option, key }

    result[key] = expanded

    if (option.short)
      result[option.short] = expanded

  }

  return result

}

/**
 * Применяет схему к токенам и извлекает значения.
 *
 * Возвращает:
 * - значения по схеме,
 * - позиционные аргументы,
 * - индексы использованных позиционных аргументов.
 *
 * @param schema Схема опций
 * @param tokens Токены командной строки
 * @returns Объект со значениями, позиционными аргументами и неизвестными токенами
 *
 * @since 0.4.0
 *
 * @internal
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

    if (option.type === 'boolean') {

      values[option.key] = true

    }
    else {

      if (token.value !== undefined) {

        values[option.key] = token.value

      }
      else if (nextIndex < tokens.length) {

        const nextToken = tokens[nextIndex]

        if (nextToken.kind === 'positional') {

          values[option.key] = nextToken.value
          localConsumedIndices.add(nextIndex)

        }

      }

    }

  }

  return {
    values,
    positionals,
    consumedIndices: [...localConsumedIndices],
  }

}

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
 * Создаёт экземпляр StagedArgs с заданными токенами и списком известных аргументов.
 *
 * @param tokens Токенизированные аргументы командной строки
 * @param knownArgs Список имён опций, уже обработанных на предыдущих этапах
 * @returns Новый экземпляр StagedArgs
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
function createStage(
  tokens: readonly Token[],
  knownArgs: readonly string[] = [],
  consumedIndices: readonly number[] = []
): StagedArgs {

  const parse = <TSchema extends OptionSchema>(
    schema: TSchema
  ): ParseResult<TSchema> => {

    const currentKnownArgs = extendKnownArgs(knownArgs, schema)

    const {
      values,
      positionals,
      consumedIndices: localConsumedIndices,
    } = mapToSchema(schema, tokens, consumedIndices)

    const stagedArgs = createStage(tokens, currentKnownArgs, localConsumedIndices)

    return {
      values: values as Values<TSchema>,
      positionals,
      stagedArgs,
    }

  }

  const parseFinal = <TSchema extends OptionSchema>(
    schema: TSchema
  ): FinalParseResult<TSchema> => {

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
 * Создаёт объект для итеративного парсинга аргументов командной строки.
 *
 * Первый шаг в цепочке: токенизирует `process.argv` и возвращает {@link StagedArgs}.
 *
 * @param args Аргументы командной строки (обычно `process.argv.slice(2)`)
 * @returns Объект для поэтапного парсинга
 *
 * @example
 * ```ts
 * const args = createStagedArgs(process.argv.slice(2))
 * ```
 * @since 0.4.0
 *
 **/
export function createStagedArgs(args: string[]): StagedArgs {

  const { tokens } = parseArgs({
    args,
    tokens: true,
    strict: false,
    allowPositionals: true,
  })

  return createStage(tokens)

}
