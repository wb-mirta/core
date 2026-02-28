/**
 * Класс ошибки для обработки проблем с монорепозиторием,
 * расширяющий стандартный Error.
 *
 * @since 0.4.0
 *
 **/
export class WorkspaceError extends Error {

  /** Код ошибки для программной идентификации. */
  readonly code: string;

  /**
   * Приватный конструктор для создания экземпляра ошибки.
   *
   * @param message - Сообщение об ошибке
   * @param code - Код ошибки
   * @param scope - Область, к которой относится ошибка (по умолчанию '@mirta/workspace').
   *
   **/
  private constructor(message: string, code: string, scope = '@mirta/workspace') {

    super(`[${scope}] ${message}`);

    this.name = 'WorkspaceError';
    this.code = code;

    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, WorkspaceError.get);

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
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

    invalidWorkspaces: (pkgPath: string) =>
      `Invalid workspaces in "${pkgPath}": must be array of strings`,

  } as const;

  /**
   * Статический метод для получения экземпляра ошибки по коду.
   *
   * @template T - Тип ключа из codeMappings
   * @param code - Код ошибки
   * @param args - Аргументы для формирования сообщения
   * @returns Экземпляр {@link WorkspaceError}
   *
   **/
  static get<T extends keyof typeof WorkspaceError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof WorkspaceError['codeMappings'][T]>
  ): WorkspaceError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string;

    const message = messageFn(...args);

    return new WorkspaceError(message, code);

  }
}
