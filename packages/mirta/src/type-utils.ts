// Внимание! Внутренняя типизация, может измениться.

export type When<TCondition extends boolean | undefined, ThenType, ElseType>
  = TCondition extends true
    ? ThenType
    : ElseType

/**
 * Определяет, имеет ли свойство строго заданное значение.
 *
 * @example
 * ```ts
 * type A = IsSpecified<{ value?: string }, 'value'> // A = false
 * type B = IsSpecified<{ value: undefined }, 'value'> // B = false
 * type C = IsSpecified<{ value: string }, 'value'> // C = true
 * ```
 * @since 0.1.0
 */
export type IsSpecified<
  TObject,
  TKey extends keyof TObject
>
  = TObject extends Record<TKey, infer TValue>
    ? (
        TValue extends undefined
          ? false
          : true
      )
    : false

/**
 * Выбирает тип в зависимости от наличия явно заданного значения.
 * @since 0.1.0
 */
export type WhenSpecified<
  TObject,
  TKey extends keyof TObject,
  ThenType,
  ElseType
>
  = IsSpecified<TObject, TKey> extends true
    ? ThenType
    : ElseType

/**
 * На основе заданного свойства определяет, будет ли
 * возвращаемый тип строгим.
 *
 * Используется, чтобы убрать неопределённость
 * при наличии конкретного значения.
 *
 * Наиболее полно раскрывает себя в контексте вызова.
 *
 * @example
 * ```ts
 * interface Options {
 *   defaultValue?: string
 * }
 *
 * function useComponent<TOptions extends Options>(
 *   _options?: TOptions
 * ): StrictWhenSpecified<TOptions, 'defaultValue', string> {
 *
 *   return void 0 as never
 *
 * }
 *
 * // Тип результата - string | undefined
 *
 * const r1 = useComponent()
 * const r2 = useComponent({ defaultValue: undefined })
 *
 * // Тип результата - string
 *
 * const r3 = useComponent({ defaultValue: '' })
 * ```
 * @since 0.1.0
 **/
export type StrictWhenSpecified<
  TObject,
  TKey extends keyof TObject,
  TReturn
>
  = IsSpecified<TObject, TKey> extends true
    ? TReturn
    : TReturn | undefined

/**
 * Устанавливает указанное свойство в readonly при выполнении указанного условия.
 * @since 0.1.0
 **/
export type ReadonlyPropWhen<TObject, K extends keyof TObject, TCondition extends boolean | undefined>
  = TCondition extends true
    ? Expand<Omit<TObject, K> & { +readonly [P in K]-?: TObject[P]; }>
    : TObject

/**
 * Проверяет, что указанный тип объекта имеет хотя бы одно свойство заданного типа.
 * Применяется для работы с дженериками.
 *
 * @example
 * ```ts
 * type A = { propA: { required: true }, propB: { required: false } }
 * type Y = HasPropertyOfType<A, { required: true }> // Y = true
 *
 * type B = { propA: { required: false }, propB: { required: false } }
 * type N = HasPropertyOfType<B, { required: true }> // N = false
 * ```
 * @since 0.1.0
 **/
export type HasPropertyOfType<TObject extends object, TProperty> = {
  // Отбрасываем ключи, в которых тип свойства не совпадает с искомым типом.
  [K in keyof TObject as TObject[K] extends TProperty ? K : never]: unknown
} extends infer R
  // Проверяем, есть ли ключи в результирующем объекте.
  ? {} extends R
      ? false
      : true
  : never

/**
 * Извлекает из массива функций типы возвращаемых значений
 * и отдаёт их в виде пересечения.
 * @since 0.1.0
 **/
export type IntersectReturnTypes<TArray>
  = TArray extends [(...args: unknown[]) => infer TReturn, ...infer TRest]
    ? TReturn & IntersectReturnTypes<TRest>
    : object
