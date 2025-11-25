/**
 * Используется для нормализации составных типов.
 *
 * @example
 * ```ts
 * interface A { value: number }
 * interface B { isReadonly: boolean }
 *
 * type C = A & B
 * // A & B
 *
 * type D = Expand<A & B>
 * // {
 * //   value: number;
 * //   isReadonly: boolean;
 * // }
 * ```
 * @since 0.0.4
 *
 **/
declare type Expand<T> = { [K in keyof T]: T[K] } & {}

/**
 * Разрешает частичное заполнение полей объекта, но требует наличия хотя бы одного поля.
 *
 * @example
 * ```ts
 * interface SafeRange {
 *   minValue: number
 *   maxValue: number
 * }
 *
 * // Корректное объявление
 * const a: AtLeastOne<SafeRange> = {
 *   minValue: 0
 * }
 *
 * // Ошибка - требуется хотя бы одно из обязательных полей
 * const b: AtLeastOne<SafeRange> = { }
 * ```
 * @since 0.3.3
 *
 **/
declare type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

/**
 * Утилита для создания "брендированных типов" (branded types).
 *
 * Позволяет создавать типобезопасные псевдонимы простых типов, предотвращая их взаимозаменяемость.
 * Полезно для разграничения значений, имеющих одинаковый базовый тип, но разное назначение.
 *
 * На уровне JavaScript это не оказывает влияния (исчезает при компиляции),
 * однако при работе с TypeScript обеспечивает строгую проверку типов.
 *
 * @template TValue - Базовый тип (например, string, number)
 * @template TBrand - Уникальная метка, определяющая семантику типа
 *
 * @example
 * type UserID = Branded<string, 'UserID'>
 * type OrderID = Branded<string, 'OrderID'>
 *
 * const userId: UserID = 'user-123' as UserID
 * const orderId: OrderID = userId // Ошибка: типы 'UserID' и 'OrderID' несовместимы
 *
 * @since 0.4.0
 *
 **/
declare type Branded<TValue, TBrand> = TValue & { readonly __brand: TBrand }
