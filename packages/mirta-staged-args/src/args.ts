import { parseArgs } from 'node:util'

import type {
  OptionToken,
  Token,
  OptionSchema,
  Values,
  StagedArgs,
  StagedArgsOptions,
  StagedArgsContext,
  SuggestFunc,
  ParsedArgs,
  ParsedArgsFinal,
  ParseError
} from './types'

import { mapToSchema } from './schema'
import { ResultHandler, type Result } from './result'

/**
 * Проверяет, что все опции в токенах известны. Если нет — формирует набор ошибок с подсказками.
 *
 * @param tokens - Список токенов.
 * @param knownArgs - Список известных имён опций и их коротких алиасов.
 * @returns Набор ошибок или `undefined`, если ошибок нет.
 *
 * @since 0.4.0
 *
 **/
function restrictUnknownOptions(
  tokens: readonly Token[],
  knownArgs: readonly string[],
  suggest?: SuggestFunc
): ParseError[] | undefined {

  // Находим незадействованные опции.
  const unknownTokens = tokens.filter(
    (token): token is OptionToken =>
      token.kind === 'option'
      && !knownArgs.includes(token.name)
  )

  if (unknownTokens.length === 0)
    return

  const errors = unknownTokens.map((token) => {

    const name = token.name

    const error: ParseError = {

      type: 'unknown-option',
      option: token.rawName,
      suggestion: suggest && name.length > 1
        ? suggest(name, knownArgs)
        : undefined,

    }

    return error

  })

  return errors

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
function extendKnownArgs(knownArgs: readonly string[] | undefined, schema: OptionSchema) {

  const knownSet = new Set(knownArgs ?? [])

  for (const key of Object.keys(schema)) {

    knownSet.add(key)

    const short = schema[key].short

    if (short)
      knownSet.add(short)

  }

  return [...knownSet]

}

/**
 * Внутренняя функция для поэтапного разбора аргументов.
 *
 * @param args - Аргументы командной строки.
 * @param schema - Схема опций для текущего этапа.
 * @param context - Контекст предыдущих этапов (схема, известные аргументы, suggest и т.д.).
 * @param options - Дополнительные настройки.
 * @returns Результат разбора: данные или ошибки.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
function parseInternal<TSchema extends OptionSchema>(
  args: string[],
  schema: TSchema,
  context: StagedArgsContext,
  options: { noUnknown?: boolean } = {}
) {

  // 1. Объединяем схемы для parseArgs
  const stagedSchema = { ...context.schema, ...schema }

  // 2. Токенизируем с полным контекстом
  const { tokens } = parseArgs({
    args,
    options: stagedSchema,
    tokens: true,
    strict: false,
    allowPositionals: true,
  })

  const knownArgs = extendKnownArgs(context.knownArgs, schema)

  // Проверяем неизвестные опции, если запрещены
  if (options.noUnknown) {

    const errors = restrictUnknownOptions(
      tokens,
      knownArgs,
      context.suggest
    )

    if (errors)
      return ResultHandler.failed(errors)

  }

  const mapResult = mapToSchema(schema, tokens, context.consumedIndices)

  if (mapResult.hasErrors)
    return mapResult

  const {
    values,
    positionals,
    consumedIndices: localConsumedIndices,
  } = mapResult.data

  let stagedArgs: StagedArgs | undefined

  return ResultHandler.ok({

    values: values as Values<TSchema>,

    positionals,

    get stagedArgs() {

      return stagedArgs ??= createStage(args, {
        suggest: context.suggest,
        schema: stagedSchema,
        knownArgs: knownArgs,
        consumedIndices: localConsumedIndices,
      })

    },

  })

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
  context: StagedArgsContext = {}
): StagedArgs {

  const parse = <TSchema extends OptionSchema>(
    schema: TSchema
  ): Result<ParsedArgs<TSchema>, ParseError> => {

    return parseInternal(args, schema, context)

  }

  const parseFinal = <TSchema extends OptionSchema>(
    schema: TSchema
  ): Result<ParsedArgsFinal<TSchema>, ParseError> => {

    const result = parseInternal(args, schema, context, {
      noUnknown: true,
    })

    if (result.hasErrors)
      return result

    return ResultHandler.ok({

      values: result.data.values,
      positionals: result.data.positionals,

    })

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
export function createStagedArgs(args: string[], options: StagedArgsOptions = {}): StagedArgs {

  const { suggest } = options

  return createStage(args, { suggest })

}
