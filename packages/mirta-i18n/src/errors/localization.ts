import { THIS_PACKAGE_NAME } from '#src/constants'
import type { MessageVariable } from '#src/types'

/**
 * Специализированный класс для обработки ошибок, связанных с работой локализации.
 *
 * Предоставляет структурированные и типизированные ошибки с использованием кодов, что упрощает
 * программную обработку исключений в инструментах, работающих с пакетами.
 *
 * @example
 * ```ts
 * throw LocalizationError.get('fallback.LoadFailed', 'en-US')
 * ```
 * @since 0.4.0
 *
 **/
export class LocalizationError extends Error {

  /**
   * Код ошибки для программной идентификации.
   *
   * Позволяет точно определить причину ошибки в обработчиках `try/catch`.
   *
   **/
  readonly code: string

  /**
   * Приватный конструктор, используемый только внутри
   * класса для создания экземпляров ошибки.
   *
   * @param message - Полное сообщение об ошибке.
   * @param code - Код ошибки для идентификации.
   * @param scope - Пространство имён или модуль, в котором возникла ошибка.
   *                По умолчанию — {@link THIS_PACKAGE_NAME}.
   *
   **/
  private constructor(message: string, code: string, scope?: string) {

    super(`[${scope ?? THIS_PACKAGE_NAME}] ${message}`)

    this.name = 'LocalizationError'
    this.code = code

    // Захватываем стек вызовов, исключая фабричный метод `get`,
    // чтобы улучшить читаемость трассировки.
    //
    if ('captureStackTrace' in Error)

      Error.captureStackTrace(this, scope
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ? LocalizationError.getScoped
        // eslint-disable-next-line @typescript-eslint/unbound-method
        : LocalizationError.get
      )

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    'strict.invalidPluralValue': (variable: string, value: MessageVariable) =>
      `Expected number for "${variable}", got ${typeof value} (${JSON.stringify(value)})`,

    'fallback.loadFailed': (locale: string) =>
      `Failed to load fallback locale "${locale}"`,

  } as const

  /**
   * Фабричный метод для создания экземпляра ошибки по её коду.
   *
   * Автоматически подставляет сообщение из `codeMappings` и формирует ошибку с заданными параметрами.
   *
   * @template T - Ограниченный ключами `codeMappings` тип, гарантирующий корректность кода.
   * @param code - Код ошибки (например, `'fallback.loadFailed'`).
   * @param args - Аргументы, соответствующие параметрам функции сообщения из `codeMappings`.
   * @returns Новый экземпляр {@link LocalizationError} с шаблонным сообщением.
   *
   * @example
   * ```ts
   * const error = LocalizationError.get('fallback.loadFailed', 'en-US')
   * ```
   */
  static get<T extends keyof typeof LocalizationError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof LocalizationError['codeMappings'][T]>
  ): LocalizationError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string

    const message = messageFn(...args)

    return new LocalizationError(message, code)

  }

  /**
   * Фабричный метод, аналогичный `get`, но с возможностью указать
   * пользовательское пространство имён (scope).
   *
   * Полезно при использовании в других модулях, где нужно указать
   * иной контекст ошибки.
   *
   * @template TKey - Тип кода ошибки, аналогично `get`.
   *
   * @param scope - Пространство имён ошибки (например, `'@mirta/store'`).
   * @param code - Код ошибки.
   * @param args - Аргументы для формирования сообщения.
   *
   * @returns Новый экземпляр {@link LocalizationError} с пользовательским
   *          префиксом и шаблонным сообщением.
   *
   * @example
   *
   * ```ts
   * const error = LocalizationError.getScoped('@mirta/cli', 'fallback.loadFailed', 'en-US')
   * ```
   **/
  static getScoped<TKey extends keyof typeof LocalizationError['codeMappings']>(
    scope: string,
    code: TKey,
    ...args: Parameters<typeof LocalizationError['codeMappings'][TKey]>
  ): LocalizationError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string

    const message = messageFn(...args)

    return new LocalizationError(message, code, scope)

  }
}
