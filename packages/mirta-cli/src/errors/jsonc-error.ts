import { THIS_PACKAGE_NAME } from '#src/constants'

/**
 * Специализированный класс для обработки ошибок, связанных с ресурсами проекта.
 *
 * @since 0.4.0
 *
 **/
export class JsoncSyntaxError extends Error {

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
  constructor(message: string, offset: number, length: number) {

    super(`[${THIS_PACKAGE_NAME}] ${message} at offset ${offset}, length ${length}`)

    this.name = 'JsoncSyntaxError'

    Error.captureStackTrace(this)

  }

}
