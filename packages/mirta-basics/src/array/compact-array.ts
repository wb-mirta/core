/**
 * Преобразует входные данные в массив, исключая все "ложные" значения.
 *
 * К ложным значениям относятся: `0`, `''`, `false`, `null`, `undefined`, `NaN`.
 *
 * @template TItem - Тип допустимых значений.
 * @param input - Вход: значение или массив с возможными `false`, `null`, `undefined`.
 * @returns Массив истинных значений типа `TItem[]`. Если вход пустой — возвращает `[]`.
 *
 * @example
 *
 * ```ts
 * compactArray([1, null, 2, '']) // → [1, 2]
 *
 * ```
 * @example
 *
 * ```ts
 * compactArray('hello') // → ['hello']
 *
 * ```
 * @example
 *
 * ```ts
 * compactArray(undefined) // → []
 *
 * ```
 *
 * @since 0.4.0
 *
 **/
export function compactArray<TItem>(
  input: TItem | false | null | undefined | (TItem | false | null | undefined)[]
): TItem[] {

  if (Array.isArray(input))
    return input.filter(Boolean) as TItem[]

  return input ? [input] : []

}
