import { THIS_PACKAGE_NAME } from '#src/constants'

/**
 * Шаблоны сообщений об ошибках в схеме.
 *
 * Каждая функция принимает параметры, специфичные для типа ошибки.
 *
 * @since 0.4.0
 *
 **/
const errorMessages = {

  /**
   * Вызывается при попытке использовать уже занятое имя опции.
   *
   * @param name - Имя, которое пытается занять.
   * @param knownName - Имя, которое уже занято.
   *
   **/
  'duplicateName': (name: string, knownName: string) => `Option name "${name}" is already used for "${knownName}"`,

  /**
   * Вызывается, если у опции, требующей значение, оно отсутствует.
   *
   * @param name - Имя опции без значения.
   *
   **/
  'missingValue': (name: string) => `Missing value for option "${name}"`,

} as const

/**
 * Коды ошибок, которые могут возникнуть при проверке схемы.
 *
 * @since 0.4.0
 *
 **/
type ErrorCode = keyof typeof errorMessages

/**
 * Ошибки этапа разработки, связанные с валидацией схемы.
 *
 * @since 0.4.0
 *
 **/
export class SchemaError extends Error {

  /**
   * Код ошибки — идентификатор типа проблемы.
   *
   * Используется для точной идентификации причины.
   */
  readonly code: ErrorCode

  /**
   * Создаёт экземпляр ошибки схемы.
   *
   * @param message - Полное сообщение об ошибке.
   * @param code - Код ошибки для программной обработки.
   *
   **/
  private constructor(
    message: string,
    code: ErrorCode
  ) {

    super(`[${THIS_PACKAGE_NAME}] ${message}`)

    Object.setPrototypeOf(this, SchemaError.prototype)

    this.name = 'SchemaError'
    this.code = code

    Error.captureStackTrace(this, SchemaError)

  }

  /**
   * Фабричный метод для создания типизированных ошибок схемы.
   *
   * @param code - Код ошибки (ключ из `errorMessages`).
   * @param args - Аргументы, зависящие от типа ошибки.
   * @returns Экземпляр `SchemaError` с готовым сообщением.
   *
   * @example
   * ```ts
   * const error = SchemaError.get('duplicateName', 'config', 'source');
   * // [package] Option name "config" is already used for "source"
   * ```
   **/
  static get<TError extends keyof typeof errorMessages>(
    code: TError,
    ...args: Parameters<typeof errorMessages[TError]>
  ): SchemaError {

    const messageFn
      = errorMessages[code] as (...args: unknown[]) => string

    const message = messageFn(...args)

    return new SchemaError(message, code)

  }

}
