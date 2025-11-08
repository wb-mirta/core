/**
 * Класс ошибки сборки, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class BuildError extends Error {

  /** Код ошибки для программной идентификации. */
  readonly code: string

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param code - Код ошибки
   * @param scope - Область действия ошибки (по умолчанию '@mirta/rollup')
   *
   **/
  private constructor(message: string, code: string, scope = '@mirta/rollup') {

    super(`[${scope}] ${message}`)

    this.name = 'BuildError'
    this.code = code

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, BuildError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /** Ошибка, возникающая когда чанк выходит за пределы собираемого пакета. */
    chunkOutsidePackage: (chunkName: string, packageName: string, workspacePath: string) =>
      `Chunk "${chunkName}" is not within package "${packageName}" workspace path "${workspacePath}"`,

  } as const

  /**
   * Статический метод для получения экземпляра ошибки по коду.
   *
   * @template T - Тип ключа из codeMappings
   * @param code - Код ошибки
   * @param args - Аргументы для формирования сообщения
   * @returns Экземпляр {@link BuildError}
   *
   **/
  static get<T extends keyof typeof BuildError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof BuildError['codeMappings'][T]>
  ): BuildError {

    const messageFn
      = this.codeMappings[code] as ((...args: unknown[]) => string)

    const message = messageFn(...args)

    return new BuildError(message, code)

  }
}

/**
 * Класс ошибки сборки под NPM, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class NpmBuildError extends Error {

  /** Код ошибки для программной идентификации. */
  readonly code: string

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param code - Код ошибки
   * @param scope - Область действия ошибки (по умолчанию '@mirta/rollup NPM')
   *
   **/
  private constructor(message: string, code: string, scope = '@mirta/rollup NPM') {

    super(`[${scope}] ${message}`)

    this.name = 'NpmBuildError'
    this.code = code

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

    return new NpmBuildError(message, code)

  }
}

/**
 * Класс ошибки трансформации AST, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class AstTransformError extends Error {

  /** Код ошибки для программной идентификации. */
  readonly code: string

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param code - Код ошибки
   * @param scope - Область действия ошибки (по умолчанию '@mirta/rollup AST')
   *
   **/
  private constructor(message: string, code: string, scope = '@mirta/rollup AST') {

    super(`[${scope}] ${message}`)
    this.name = 'AstTransformError'
    this.code = code

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, AstTransformError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    /** Ошибка, возникающая при отсутствии root-файлов в проекте. */
    noRootFiles: () =>
      'No root files found in the project. Check your TypeScript configuration (tsconfig.json)',

    /** Ошибка, возникающая при отсутствии модуля для указанного спецификатора. */
    moduleNotFound: (modulePath: string, sourceFileName: string) =>
      `Module "${modulePath}" not found in "${sourceFileName}"`,

    /** Ошибка, возникающая когда modulePath содержит недопустимые символы. */
    invalidChars: (path: string) =>
      `Invalid chars in path: "${path}"`,

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

    return new AstTransformError(message, code)

  }
}
