/**
 * Контейнер результата операции.
 *
 * @template TData - Тип данных при успешном результате.
 * @template TError - Тип ошибки при неудачном результате.
 *
 * @since 0.4.0
 *
 **/
export type Result<TData, TError>
  = | { hasErrors: false; data: TData }
    | { hasErrors: true; errors: TError[] };

/**
 * Утилита для создания значений типа {@link Result}.
 *
 * Содержит статические методы для создания успешных и неудачных результатов.
 *
 * @since 0.4.0
 *
 **/
export const ResultHandler = {

  /**
   * Создаёт успешный результат, содержащий данные.
   *
   * @param data - Данные, которые будут включены в результат.
   * @returns Объект результата с `hasErrors: false` и указанными данными.
   *
   * @template TData - Тип передаваемых данных.
   *
   * @example
   * ```ts
   * const result = ResultHandler.ok({ name: 'Alice', age: 30 });
   * // { hasErrors: false, data: { name: 'Alice', age: 30 } }
   * ```
   **/
  ok: <TData>(data: TData): Result<TData, never> => ({
    hasErrors: false,
    data,
  }),

  /**
   * Создаёт неудачный результат, содержащий список ошибок.
   *
   * Если передан пустой массив ошибок, выбрасывается исключение,
   * так как неудачный результат должен содержать хотя бы одну ошибку.
   *
   * @param errors - Массив объектов ошибок, описывающих проблемы ввода.
   * @returns Объект результата с `hasErrors: true` и указанным списком ошибок.
   *
   * @template TError - Тип объекта ошибки (например, строка или объект с типом и деталями).
   *
   * @throws {Error} Если передан пустой массив ошибок.
   *
   * @example
   * ```ts
   * const errors = [{ type: 'unknown-option', option: '--confog' }];
   * const result = ResultHandler.failed(errors);
   * // { hasErrors: true, errors: [...] }
   * ```
   **/
  failed: <TError>(errors: TError[]): Result<never, TError> => {

    if (errors.length === 0)
      throw new Error('Errors array cannot be empty');

    return {
      hasErrors: true,
      errors,
    };

  },

} as const;
