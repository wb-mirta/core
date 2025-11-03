import nodePath from 'node:path'

/**
 * Класс ошибки для обработки проблем с монорепозиторием,
 * расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class WorkspaceError extends Error {

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке.
   * @param scope - Область, к которой относится ошибка (по умолчанию '@mirta/rollup').
   *
   **/
  private constructor(message: string, scope = '@mirta/rollup') {

    super(`[${scope}] ${message}`)

    this.name = 'WorkspaceError'

    if ('captureStackTrace' in Error)
    // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, WorkspaceError.get)

  }

  private static readonly codeMappings = {

    /**
     * Ошибка, возникающая, когда не найден ни один из lock-файлов пакетных менеджеров
     * (pnpm-lock.yaml, yarn.lock, package-lock.json, bun.lockb) в текущей или родительских директориях.
     *
     **/
    noLockfile: () =>
      'No lockfile (pnpm/yarn/bun/npm) found. Required to detect workspace root',

    noPackageName: (packagePath: string) =>
      `Package with path "${packagePath}" missing required 'name' field in package.json`,

    noWorkspaces: () =>
      'No workspaces configured in root package.json',

    badWorkspacesFormat: (pkgPath: string) =>
      `Bad workspaces format in "${pkgPath}": it must be array of strings`,

  } as const

  static get<T extends keyof typeof WorkspaceError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof WorkspaceError['codeMappings'][T]>
  ): WorkspaceError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string

    const message = messageFn(...args)

    return new WorkspaceError(message)

  }
}

/**
 * Класс ошибки для обработки проблем с файлами, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class FileError extends Error {

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке.
   * @param scope - Область, к которой относится ошибка (по умолчанию '@mirta/rollup').
   *
   **/
  private constructor(message: string, scope = '@mirta/rollup') {

    super(`[${scope}] ${message}`)

    this.name = 'FileError'

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, FileError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /** Ошибка, возникающая при отсутствии файла в указанном расположении. */
    notFound: (filePath: string) =>
      `File not found: "${filePath}"`,

    /** Ошибка, возникающая при отсутствии доступа к указанному файлу. */
    noAccess: (filePath: string) =>
      `No access to file "${filePath}"`,

    /** Ошибка, возникающая при невалидном JSON в файле. */
    invalidJson: (filePath: string, message: string) =>
      `Invalid JSON in file "${filePath}": ${message}`,

    /** Ошибка парсинга, возникающая по неуточненным причинам. */
    failedToParse: (filePath: string, message: string) =>
      `Failed to parse "${nodePath.basename(filePath)}": ${message}`,

  } as const

  /**
   * Статический метод для получения экземпляра ошибки по коду.
   *
   * @template T - Тип ключа из codeMappings
   * @param code - Код ошибки
   * @param args - Аргументы для формирования сообщения
   * @returns Экземпляр {@link FileError}
   *
   **/
  static get<T extends keyof typeof FileError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof FileError['codeMappings'][T]>
  ): FileError {

    const messageFn
      = this.codeMappings[code] as ((...args: unknown[]) => string)

    const message = messageFn(...args)

    return new FileError(message)

  }
}

/**
 * Класс ошибки сборки под NPM, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class NpmBuildError extends Error {

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param scope - Область действия ошибки (по умолчанию '@mirta/rollup NPM')
   *
   **/
  private constructor(message: string, scope = '@mirta/rollup NPM') {

    super(`[${scope}] ${message}`)

    this.name = 'NpmBuildError'

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, NpmBuildError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /** Ошибка, возникающая когда конфигурация input-файлов Rollup пуста. */
    inputEmpty: () =>
      'Rollup Config: Input configuration cannot be empty',

    /** Ошибка, возникающая когда input-файл не начинается с требуемого префикса. */
    inputPathRequiresPrefix: (input: string, prefix: string) =>
      `Rollup Config: Input path "${input}" must start with required prefix "${prefix}"`,

    /** Ошибка, возникающая когда input-файл имеет недопустимое расширение. */
    inputFileExtensionNotSupported: (input: string) =>
      `Rollup Config: Unsupported input "${input}". Please use valid JS or TS file extension`,

    /** Ошибка, возникающая из-за дублирования выходного файла несколькими input-файлами. */
    inputGeneratesDuplicateOutput: (outputFile: string) =>
      `Rollup Config: Duplicate output file "${outputFile}" produced by multiple inputs. Ensure each input maps to a unique export path`,

    /** Ошибка, возникающая когда input-файл не ассоциирован с экспортом в package.json. */
    inputHasNoExport: (input: string, entry: string) =>
      `Rollup Config: The input file "${input}" is not associated with corresponding export "${entry}"`,

    /** Ошибка, возникающая при отсутствии экспорта в package.json. */
    exportEmpty: () =>
      'Package Config: Missing export configuration. Please define the "exports" field',

    /** Ошибка, возникающая при экспорте типов без указания default-импорта. */
    exportTypesOnly: (types: string) =>
      `Package Config: Export contains only types "${types}" without specifying a default import in package.json`,

    /** Ошибка, возникающая при отсутствии соответствия с input-файлом конфигурации Rollup. */
    exportHasNoInput: (entry: string) =>
      `Package Config: Export "${entry}" has no corresponding input file in Rollup configuration`,

    /** Ошибка, возникающая при использовании массива в качестве значения exports. */
    exportDisallowArrayType: () =>
      'Package Config: The field "exports" must be either a string or an object, but found an array',

    /** Ошибка, возникающая при отсутствии точки в начале пути экспорта. */
    exportMustStartWithDot: (key: string) =>
      `Package Config: Invalid export path "${key}", it must start with "."`,

  } as const

  /**
   * Статический метод для получения экземпляра ошибки по коду.
   *
   * @template T - Тип ключа из codeMappings
   * @param code - Код ошибки
   * @param args - Аргументы для формирования сообщения
   * @returns Экземпляр {@link NpmBuildError}
   *
   **/
  static get<T extends keyof typeof NpmBuildError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof NpmBuildError['codeMappings'][T]>
  ): NpmBuildError {

    const messageFn
      = this.codeMappings[code] as ((...args: unknown[]) => string)

    const message = messageFn(...args)

    return new NpmBuildError(message)

  }
}

/**
 * Класс ошибки трансформации AST, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class AstTransformError extends Error {

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param scope - Область действия ошибки (по умолчанию '@mirta/rollup AST')
   *
   **/
  private constructor(message: string, scope = '@mirta/rollup AST') {

    super(`[${scope}] ${message}`)
    this.name = 'AstTransformError'

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, AstTransformError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /** Ошибка, возникающая при отсутствии root-файлов в проекте. */
    noRootFilesInProject: () =>
      'No root files found in the project. Check your TypeScript configuration (tsconfig.json)',

    /** Ошибка, возникающая при отсутствии модуля для указанного спецификатора. */
    moduleNotFound: (modulePath: string, sourceFileName: string) =>
      `Module "${modulePath}" not found in "${sourceFileName}"`,

    /** Ошибка, возникающая когда modulePath содержит недопустимые символы. */
    invalidPathFormat: (modulePath: string) =>
      `Invalid format of module path: "${modulePath}"`,

  } as const

  /**
   * Статический метод для получения экземпляра ошибки по коду.
   *
   * @template T - Тип ключа из codeMappings
   * @param code - Код ошибки
   * @param args - Аргументы для формирования сообщения
   * @returns Экземпляр {@link AstTransformError}
   *
   **/
  static get<T extends keyof typeof AstTransformError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof AstTransformError['codeMappings'][T]>
  ): AstTransformError {

    const messageFn
      = this.codeMappings[code] as ((...args: unknown[]) => string)

    const message = messageFn(...args)

    return new AstTransformError(message)

  }
}
