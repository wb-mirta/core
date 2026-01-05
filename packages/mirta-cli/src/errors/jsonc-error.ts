import { THIS_PACKAGE_NAME } from '#src/constants'

/**
 * Специализированный класс для обработки ошибок, связанных с разбором JSONC.
 *
 * @since 0.4.0
 *
 **/
export class JsoncSyntaxError extends Error {

  /**
   * Конструктор для создания экземпляра ошибки синтаксиса JSONC.
   *
   * @param message - Полное сообщение об ошибке.
   * @param offset - Позиция начала ошибки в исходной строке.
   * @param length - Длина фрагмента с ошибкой.
   *
   **/
  constructor(message: string, offset: number, length: number) {

    super(`[${THIS_PACKAGE_NAME}] ${message} at offset ${offset}, length ${length}`)

    this.name = 'JsoncSyntaxError'

    Error.captureStackTrace(this)

  }

}
