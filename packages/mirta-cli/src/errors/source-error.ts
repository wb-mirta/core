import { THIS_PACKAGE_NAME } from '#src/constants';

/**
 * Специализированный класс для обработки ошибок, связанных с ресурсами проекта.
 *
 * @example
 * ```ts
 * throw SourceError.get('file.accessDenied', '/path/to/file')
 * ```
 * @since 0.4.0
 *
 **/
export class SourceError extends Error {

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

    this.name = 'SourceError';
    this.code = code;

    // Захватываем стек вызовов, исключая фабричный метод `get`,
    // чтобы улучшить читаемость трассировки.
    //
    if ('captureStackTrace' in Error)

      Error.captureStackTrace(this, scope
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ? SourceError.getScoped
        // eslint-disable-next-line @typescript-eslint/unbound-method
        : SourceError.get
      );

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    'path.outsideRoot': (path: string) =>
      `Path "${path}" is outside the root directory`,

    'file.notFound': (filePath: string) =>
      `File not found: "${filePath}"`,

    'file.accessDenied': (filePath: string) =>
      `Access denied to "${filePath}"`,

    'file.failedToRead': (filePath: string, reason: string | null | undefined) =>
      `Failed to read "${filePath}": ${reason ?? 'unknown reason'}`,

    /**
     * Ошибка парсинга JSON.
     *
     * @param filePath - Путь к файлу с некорректным JSON.
     * @param message - Сообщение об ошибке от парсера (например, `Unexpected token }`).
     *
     **/
    'parse.invalidJson': (filePath: string, message: string) =>
      `Invalid JSON in file "${filePath}": ${message}`,

    /**
     * Ошибка, когда корневой элемент JSON не является объектом (`{}`).
     *
     **/
    'parse.invalidJsonRoot': () =>
      'Invalid JSON: root must be an object, not an array or primitive value',

  } as const;

  static isFileError(error: unknown): error is SourceError {

    return error instanceof SourceError && error.code.startsWith('file.');

  }

  static isParseError(error: unknown): error is SourceError {

    return error instanceof SourceError && error.code.startsWith('parse.');

  }

  /**
   * Фабричный метод для создания экземпляра ошибки по её коду.
   *
   * Автоматически подставляет сообщение из `codeMappings` и формирует ошибку с заданными параметрами.
   *
   * @template T - Ограниченный ключами `codeMappings` тип, гарантирующий корректность кода.
   * @param code - Код ошибки (например, `'alreadyDefined'`).
   * @param args - Аргументы, соответствующие параметрам функции сообщения из `codeMappings`.
   * @returns Новый экземпляр {@link SourceError} с шаблонным сообщением.
   *
   * @example
   * ```ts
   * const error = SourceError.get('file.notFound', '/path/to/file.json')
   * ```
   **/
  static get<T extends keyof typeof SourceError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof SourceError['codeMappings'][T]>
  ): SourceError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new SourceError(message, code);

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
   * @param scope - Пространство имён ошибки (например, `'@mirta/bots-remote'`).
   * @param code - Код ошибки.
   * @param args - Аргументы для формирования сообщения.
   *
   * @returns Новый экземпляр {@link SourceError} с пользовательским
   *          префиксом и шаблонным сообщением.
   *
   * @example
   *
   * ```ts
   * const error = SourceError.getScoped('@mirta/bots-remote', 'file.accessDenied', '/path/to/file')
   * ```
   **/
  static getScoped<TKey extends keyof typeof SourceError['codeMappings']>(
    scope: string,
    code: TKey,
    ...args: Parameters<typeof SourceError['codeMappings'][TKey]>
  ): SourceError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new SourceError(message, code, scope);

  }
}
