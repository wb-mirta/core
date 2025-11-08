import nodePath from 'node:path'

/**
 * Класс ошибки для обработки проблем с чтением `package.json`,
 * расширяющий стандартный Error.
 *
 * @since 0.4.0
 *
 **/
export class PackageError extends Error {

  /** Код ошибки для программной идентификации. */
  readonly code: string

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param code - Код ошибки
   * @param scope - Область, к которой относится ошибка (по умолчанию '@mirta/package').
   *
   **/
  private constructor(message: string, code: string, scope = '@mirta/package') {

    super(`[${scope}] ${message}`)

    this.name = 'PackageError'
    this.code = code

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, PackageError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /** Ошибка, возникающая при отсутствии файла в указанном расположении. */
    notFound: (filePath: string) =>
      `File not found: "${filePath}"`,

    /** Ошибка, возникающая при отсутствии доступа к указанному файлу. */
    accessDenied: (filePath: string) =>
      `Access denied to file "${filePath}"`,

    /** Ошибка, возникающая при невалидном пути. */
    invalidPath: (path: string) =>
      `Invalid path "${path}": expected a path to "package.json" or a package directory`,

    /** Ошибка, возникающая при невалидном JSON в файле. */
    invalidJson: (filePath: string, message: string) =>
      `Invalid JSON in file "${filePath}": ${message}`,

    /** Проверка на соответствие конфигурации базовому типу. */
    invalidJsonRoot: () =>
      'Invalid JSON: root must be an object, not an array or primitive value',

    /** Ошибка чтения, возникающая по неуточненным причинам. */
    failedToRead: (filePath: string, message: string) =>
      `Failed to read "${nodePath.basename(filePath)}": ${message}`,

  } as const

  /**
   * Статический метод для получения экземпляра ошибки по коду.
   *
   * @template T - Тип ключа из codeMappings
   * @param code - Код ошибки
   * @param args - Аргументы для формирования сообщения
   * @returns Экземпляр {@link PackageError}
   *
   **/
  static get<T extends keyof typeof PackageError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof PackageError['codeMappings'][T]>
  ): PackageError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string

    const message = messageFn(...args)

    return new PackageError(message, code)

  }
}
