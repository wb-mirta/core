/**
 * Класс ошибки сборки под NPM, расширяющий стандартный Error.
 *
 * @since 0.3.5
 *
 **/
export class NpmBuildError extends Error {

  private constructor(message: string, scope = 'Mirta Rollup for NPM') {

    super(`[${scope}] ${message}`)

    this.name = 'NpmBuildError'

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, NpmBuildError.get)

  }

  private static codeMappings = {

    /** Ошибка, возникающая когда конфигурация input-файлов Rollup пуста. */
    inputEmpty: () =>
      'Rollup Config: Input configuration cannot be empty',

    /** Ошибка, когда input-файл не начинается с требуемого префикса. */
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

  static get<T extends keyof typeof NpmBuildError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof NpmBuildError['codeMappings'][T]>
  ): NpmBuildError {

    const messageFn
      = this.codeMappings[code] as ((...args: unknown[]) => string)

    const message = messageFn(...args)

    const error = new NpmBuildError(message)

    return error

  }
}
