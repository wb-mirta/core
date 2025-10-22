/**
 * Преобразует входные данные в массив, исключая "ложные" значения (`false`, `null`, `undefined`).
 *
 * @param input - Входные данные, которые могут быть:
 *   - массивом элементов типа `TItem | false | null | undefined`;
 *   - отдельным элементом типа `TItem | false | null | undefined`.
 * @returns Массив элементов типа `TItem`, содержащий только "истинные" значения.
 *
 * @example
 *
 * ```ts
 * ensureCompactArray([1, null, 2]) // [1, 2]
 *
 * ensureCompactArray(undefined) // []
 *
 * ensureCompactArray('test') // ['test']
 *
 * ```
 * @since 0.3.5
 *
 **/
export function ensureCompactArray<TItem>(
  input: (TItem | false | null | undefined)[] | TItem | false | null | undefined
): TItem[] {

  if (Array.isArray(input))
    return input.filter(Boolean) as TItem[]

  if (input)
    return [input]

  return []

}
