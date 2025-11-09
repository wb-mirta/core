/**
 * Преобразует входное значение в массив.
 *
 * Если входное значение уже является массивом, возвращает его копию.
 * В противном случае оборачивает значение в массив и возвращает результат.
 *
 * @template TItem - Тип элемента или массива элементов.
 * @param input - Входное значение, которое может быть одиночным элементом или массивом элементов.
 * @returns Массив, содержащий один элемент (если входной — не массив) или копию входного массива.
 *
 * @example
 * ```ts
 * ensureArray('hello') // → ['hello']
 * ```
 * @example
 * ```ts
 * ensureArray([1, 2, 3]) // → [1, 2, 3]
 * ```
 * @example
 * ```ts
 * ensureArray(null) // → [null]
 * ```
 * @since 0.4.0
 *
 **/
export function ensureArray<TItem>(input: TItem | TItem[]): TItem[] {

  return Array.isArray(input) ? [...input] : [input]

}
