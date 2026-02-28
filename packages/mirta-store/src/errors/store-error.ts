import { THIS_PACKAGE_NAME } from '#src/constants';

/**
 * Специализированный класс для обработки ошибок, связанных с работой хранилища Store.
 *
 * Предоставляет структурированные и типизированные ошибки с использованием кодов, что упрощает
 * программную обработку исключений в инструментах, работающих с пакетами.
 *
 * @example
 * ```ts
 * throw StoreError.get('alreadyDefined', 'mystore')
 * ```
 * @since 0.4.0
 *
 **/
export class StoreError extends Error {

  /**
   * Код ошибки для программной идентификации.
   *
   * Позволяет точно определить причину ошибки в обработчиках `try/catch`.
   *
   **/
  readonly code: string;

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

    super(`[${scope ?? THIS_PACKAGE_NAME}] ${message}`);

    this.name = 'StoreError';
    this.code = code;

    // Захватываем стек вызовов, исключая фабричный метод `get`,
    // чтобы улучшить читаемость трассировки.
    //
    if ('captureStackTrace' in Error)

      Error.captureStackTrace(this, scope
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ? StoreError.getScoped
        // eslint-disable-next-line @typescript-eslint/unbound-method
        : StoreError.get
      );

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /**
     * Ошибка, возникающая при попытке повторно определить хранилище.
     *
     * @param typeName - Идентификатор типа хранилища.
     *
     **/
    alreadyDefined: (typeName: string) =>
      `Store type "${typeName}" already defined`,

    /**
     * Ошибка, возникающая при попытке повторно определить хранилище,
     * заданное другим модулем.
     *
     * @param typeName - Идентификатор типа хранилища.
     * @param otherModule - Модуль, в котором тип уже определён.
     *
     **/
    alreadyDefinedOutside: (typeName: string, otherModule: string) =>
      `Store type "${typeName}" already defined in "${otherModule}"`,

    /**
     * Ошибка, возникающая при попытке присвоить значение неизменяемому полю.
     * @param propertyName - Название свойства, которому нельзя присваивать значение.
     *
     */
    readonlyProperty: (propertyName: string) =>
      `Cannot assign to readonly property "${propertyName}"`,

    /**
     * Ошибка, возникающая при попытке обращения к несуществующему свойству хранилища.
     * @param propertyName Имя отсутствующего свойства, вызвавшего ошибку.
     *
     **/
    unknownProperty: (propertyName: string) =>
      `Unknown property "${propertyName}"`,

  } as const;

  /**
   * Фабричный метод для создания экземпляра ошибки по её коду.
   *
   * Автоматически подставляет сообщение из `codeMappings` и формирует ошибку с заданными параметрами.
   *
   * @template T - Ограниченный ключами `codeMappings` тип, гарантирующий корректность кода.
   * @param code - Код ошибки (например, `'alreadyDefined'`).
   * @param args - Аргументы, соответствующие параметрам функции сообщения из `codeMappings`.
   * @returns Новый экземпляр {@link StoreError} с шаблонным сообщением.
   *
   * @example
   * ```ts
   * const error = StoreError.get('alreadyDefined')
   * ```
   */
  static get<T extends keyof typeof StoreError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof StoreError['codeMappings'][T]>
  ): StoreError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new StoreError(message, code);

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
   * @returns Новый экземпляр {@link StoreError} с пользовательским
   *          префиксом и шаблонным сообщением.
   *
   * @example
   *
   * ```ts
   * const error = StoreError.getScoped('@mirta/bot-remote', 'alreadyDefined')
   * ```
   **/
  static getScoped<TKey extends keyof typeof StoreError['codeMappings']>(
    scope: string,
    code: TKey,
    ...args: Parameters<typeof StoreError['codeMappings'][TKey]>
  ): StoreError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new StoreError(message, code, scope);

  }
}
