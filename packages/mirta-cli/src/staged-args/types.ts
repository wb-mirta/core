/**
 * Базовый интерфейс для токена опции командной строки.
 *
 * @remarks
 * Содержит общие поля, присутствующие во всех типах опций.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
interface OptionTokenBase {

  /**
   * Тип токена — опция.
   *
   **/
  kind: 'option'

  /**
   * Индекс аргумента в исходном массиве `process.argv`.
   *
   **/
  index: number

  /**
   * Имя опции без префиксов (например, `config` для `--config`).
   *
   **/
  name: string

  /**
   * Оригинальное написание опции, включая префиксы (например, `--config`, `-c`).
   *
   **/
  rawName: string

}

/**
 * Интерфейс для токена опции, имеющей значение.
 *
 * @remarks
 * Используется для строковых опций, таких как `--port=3000` или `--file config.json`.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
interface OptionTokenValue extends OptionTokenBase {

  /**
   * Значение опции в виде строки.
   *
   **/
  value: string

  /**
   * Флаг, указывающий, было ли значение передано "встроено" в опцию (через знак `=`).
   *
   * @example
   * ```txt
   * true: `--port=3000`
   * false: `--port 3000`
   * ```
   **/
  inlineValue: boolean

}

/**
 * Интерфейс для токена булевой опции (флага).
 *
 * @remarks
 * Такие опции не требуют значения и используются как переключатели (например, `--verbose`).
 * Также поддерживается форма `--no-xxx` для явного выключения.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
interface OptionTokenFlag extends OptionTokenBase {

  /**
   * У флагов значение отсутствует — они либо присутствуют, либо нет.
   *
   **/
  value: undefined

  /**
   * У флагов не бывает встроенного значения.
   *
   **/
  inlineValue: undefined

}

/**
 * Представляет токен опции командной строки.
 *
 * @remarks
 * Может быть булевой (без значения) или строковой опцией (со значением).
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type OptionToken = OptionTokenValue | OptionTokenFlag

/**
 * Общий тип токена командной строки.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type Token
  = | OptionToken
    | { kind: 'positional', index: number, value: string } // Позиционный аргумент
    | { kind: 'option-terminator', index: number } // Терминатор опций

/**
 * Описание типа опции в схеме.
 *
 **/
export type Option
  = | { type: 'boolean', short?: string, default?: boolean }
    | { type: 'string', short?: string, default?: string }

/**
 * Схема опций командной строки.
 *
 * @remarks
 * Ключ — имя опции (например, `verbose`), значение — её конфигурация.
 *
 * @since 0.4.0
 *
 **/
export type OptionSchema = Record<string, Option>

/**
 * Выводит тип значений на основе схемы опций.
 *
 * @typeParam TSchema — Схема опций.
 *
 * @remarks
 * Если у опции указано значение по умолчанию, оно становится обязательным.
 * Иначе — может быть `undefined`.
 *
 * @since 0.4.0
 *
 **/
export type Values<TSchema extends OptionSchema> = {

  [K in keyof TSchema]: TSchema[K] extends { type: 'string' }
    ? TSchema[K] extends { default: infer _TDefault extends string }
      ? string
      : string | undefined
    : TSchema[K] extends { type: 'boolean' }
      ? TSchema[K] extends { default: infer _TDefault extends boolean }
        ? boolean
        : boolean | undefined
      : never
}

/**
 * Результат разбора опций на промежуточной стадии.
 *
 * @typeParam TSchema - Схема опций.
 *
 * @since 0.4.0
 *
 **/
export interface ParseResult<TSchema extends OptionSchema> {

  /**
   * Значения опций, включая значения по умолчанию.
   *
   **/
  values: Values<TSchema>

  /**
   * Позиционные аргументы, не связанные с опциями.
   *
   **/
  positionals: string[]

  /**
   * Новый экземпляр `StagedArgs` для дальнейшего разбора.
   *
   **/
  stagedArgs: StagedArgs

}

/**
 * Результат окончательного разбора опций.
 *
 * @typeParam TSchema - Схема опций.
 *
 **/
export interface FinalParseResult<TSchema extends OptionSchema> {

  /**
   * Значения опций.
   *
   **/
  values: Values<TSchema>

  /**
   * Позиционные аргументы.
   *
   **/
  positionals: string[]

}

/**
 * Интерфейс для поэтапного разбора аргументов командной строки.
 *
 * @remarks
 * Позволяет разбирать опции частями, что полезно при наличии глобальных и командных флагов.
 *
 * @since 0.4.0
 *
 **/
export interface StagedArgs {

  /**
   * Разбирает аргументы по указанной схеме, не выбрасывая ошибки на неизвестные опции.
   *
   * @typeParam TSchema - Схема опций.
   * @param schema - Схема опций для разбора.
   * @returns Результат разбора и новый `StagedArgs` для последующих шагов.
   *
   **/
  parse<TSchema extends OptionSchema>(
    schema: TSchema
  ): ParseResult<TSchema>

  /**
   * Окончательный разбор аргументов. Проверяет наличие неизвестных опций и выбрасывает ошибку.
   *
   * @typeParam TSchema - Схема опций.
   * @param schema - Схема опций.
   * @returns Результат разбора.
   * @throws Ошибка, если обнаружены неизвестные опции.
   *
   **/
  parseFinal<TSchema extends OptionSchema>(
    schema: TSchema
  ): FinalParseResult<TSchema>

}
