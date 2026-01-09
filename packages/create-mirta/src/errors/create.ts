import { THIS_PACKAGE_NAME } from '#constants'
import { t } from '#i18n'

/**
 * Специализированный класс для обработки ошибок, связанных с работой локализации.
 *
 * Предоставляет структурированные и типизированные ошибки с использованием кодов, что упрощает
 * программную обработку исключений в инструментах, работающих с пакетами.
 *
 * @example
 * ```ts
 * throw CreationError.get('template.notFound', 'fullstack')
 * ```
 * @since 0.4.0
 *
 **/
export class CreationError extends Error {

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
  private constructor(message: string, code: string) {

    super(`[${THIS_PACKAGE_NAME}] ${message}`)

    this.name = 'CreationError'
    this.code = code

    // Захватываем стек вызовов, исключая фабричный метод `get`,
    // чтобы улучшить читаемость трассировки.
    //
    if ('captureStackTrace' in Error)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Error.captureStackTrace(this, CreationError.get)

  }

  /** Карта кодов ошибок с соответствующими сообщениями. */
  private static readonly codeMappings = {

    'load.noTemplates': (templateType: string) =>
      t('load.noTemplates', { type: templateType }),

    'template.notFound': (templateName: string) =>
      t('template.notFound', { name: templateName }),

    'template.invalidConfig': (templateName: string) =>
      `Invalid template config of ${templateName}`,

    'template.duplicateName': (templateName: string) =>
      `Duplicate template name ${templateName}`,

    'project.outsideRoot': () =>
      t('project.outsideRoot'),

    'project.denyOverwrite': () =>
      t('project.denyOverwrite'),

  } as const

  /**
   * Фабричный метод для создания экземпляра ошибки по её коду.
   *
   * Автоматически подставляет сообщение из `codeMappings` и формирует ошибку с заданными параметрами.
   *
   * @template T - Ограниченный ключами `codeMappings` тип, гарантирующий корректность кода.
   * @param code - Код ошибки (например, `'alreadyDefined'`).
   * @param args - Аргументы, соответствующие параметрам функции сообщения из `codeMappings`.
   * @returns Новый экземпляр {@link CreationError} с шаблонным сообщением.
   *
   **/
  static get<T extends keyof typeof CreationError['codeMappings']>(
    code: T,
    ...args: Parameters<typeof CreationError['codeMappings'][T]>
  ): CreationError {

    const messageFn
      = this.codeMappings[code] as (...args: unknown[]) => string

    const message = messageFn(...args)

    return new CreationError(message, code)

  }
}
