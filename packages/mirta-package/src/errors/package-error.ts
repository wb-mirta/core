import { THIS_PACKAGE_NAME } from '#src/constants';

/**
 * Специализированный класс для обработки ошибок, связанных с чтением и парсингом файла `package.json`.
 *
 * Предоставляет структурированные и типизированные ошибки с использованием кодов, что упрощает
 * программную обработку исключений в инструментах, работающих с пакетами.
 *
 * @example
 * ```ts
 * throw PackageError.get('notFound', '/path/to/package.json');
 * ```
 * @since 0.4.0
 *
 **/
export class PackageError extends Error {

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

    this.name = 'PackageError';
    this.code = code;

    // Захватываем стек вызовов, исключая фабричный метод `get`,
    // чтобы улучшить читаемость трассировки.
    //
    if ('captureStackTrace' in Error)

      Error.captureStackTrace(this, scope
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ? PackageError.getScoped
        // eslint-disable-next-line @typescript-eslint/unbound-method
        : PackageError.get
      );

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /**
     * Ошибка, возникающая, когда файл `package.json`
     * не найден по указанному пути.
     *
     * @param filePath - Абсолютный или относительный путь к отсутствующему файлу.
     *
     **/
    notFound: (filePath: string) =>
      `File not found: "${filePath}"`,

    /**
     * Ошибка, возникающая при отсутствии прав на чтение файла.
     *
     * @param filePath - Путь к файлу, доступ к которому запрещён.
     *
     **/
    accessDenied: (filePath: string) =>
      `Access denied to file "${filePath}"`,

    /**
     * Ошибка, возникающая при передаче невалидного пути.
     *
     * @param path - Переданный путь, не соответствующий ожидаемому формату.
     *
     **/
    invalidPath: (path: string) =>
      `Invalid path "${path}": expected a path to "package.json" or a package directory`,

    /**
     * Ошибка парсинга JSON в файле `package.json`.
     *
     * @param filePath - Путь к файлу с некорректным JSON.
     * @param message - Сообщение об ошибке от парсера (например, `Unexpected token }`).
     *
     **/
    invalidJson: (filePath: string, message: string) =>
      `Invalid JSON in file "${filePath}": ${message}`,

    /**
     * Ошибка, возникающая, если корневой элемент JSON не является объектом.
     * Согласно спецификации, `package.json` должен начинаться с `{}`.
     *
     **/
    invalidJsonRoot: () =>
      'Invalid JSON: root must be an object, not an array or primitive value',

    /**
     * Общая ошибка чтения файла с неуточнённой причиной.
     * @param filePath - Путь к файлу.
     * @param message - Возможное описание ошибки от файловой системы.
     *
     **/
    failedToRead: (filePath: string, message: string | null | undefined) =>
      `Failed to read "${filePath}": ${message ?? 'unknown reason'}`,

    /**
     * Ошибка, возникающая, если в `package.json` отсутствует поле `version`.
     *
     **/
    noVersionField: () =>
      'No version field found in package.json',

  } as const;

  /**
   * Фабричный метод для создания экземпляра ошибки по её коду.
   *
   * Автоматически подставляет сообщение из `codeMappings` и формирует ошибку с заданными параметрами.
   *
   * @template T - Ограниченный ключами `codeMappings` тип, гарантирующий корректность кода.
   * @param code - Код ошибки (например, `'notFound'`, `'invalidJson'`).
   * @param args - Аргументы, соответствующие параметрам функции сообщения из `codeMappings`.
   * @returns Новый экземпляр {@link PackageError} с шаблонным сообщением.
   *
   * @example
   * ```ts
   * const error = PackageError.get('notFound', '/src/package.json');
   * ```
   */
  static get<T extends keyof typeof PackageError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof PackageError['codeMappings'][T]>
  ): PackageError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new PackageError(message, code);

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
   * @param scope - Пространство имён ошибки (например, `'@mirta/cli'`).
   * @param code - Код ошибки.
   * @param args - Аргументы для формирования сообщения.
   *
   * @returns Новый экземпляр {@link PackageError} с пользовательским
   *          префиксом и шаблонным сообщением.
   *
   * @example
   *
   * ```ts
   * const error = PackageError.getScoped('@mirta/cli', 'invalidPath', '/invalid/path');
   * ```
   **/
  static getScoped<TKey extends keyof typeof PackageError['codeMappings']>(
    scope: string,
    code: TKey,
    ...args: Parameters<typeof PackageError['codeMappings'][TKey]>
  ): PackageError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new PackageError(message, code, scope);

  }
}
