import { isObject, isPlainObject } from '../guards'
import { hasOwn } from './helpers'

/**
 * Рекурсивно объединяет типы. Поля из `TSecond` побеждают.
 * Вложенные объекты сливаются, прочие значения — заменяются.
 *
 * @template TFirst - Тип первого объекта.
 * @template TSecond - Тип второго объекта (или `null`/`undefined`).
 */
export type DeepMerged<TFirst, TSecond> = [TFirst, TSecond] extends [object, object]
  ? {
      [K in keyof TFirst | keyof TSecond]: K extends keyof TSecond
        ? TSecond[K] extends object
          ? K extends keyof TFirst
            ? TFirst[K] extends object
              ? DeepMerged<TFirst[K], TSecond[K]>
              : TSecond[K]
            : TSecond[K]
          : TSecond[K]
        : K extends keyof TFirst
          ? TFirst[K]
          : never
    }
  : TSecond

/**
 * Рекурсивно объединяет два объекта. Не изменяет исходные.
 *
 * - Вложенные объекты — сливаются.
 * - Массивы, примитивы — заменяются целиком.
 * - Если `second` — `null`/`undefined`, возвращается копия `first`.
 *
 * @param first - Базовый объект. Должен быть объектом.
 * @param second - Объект с переопределениями. Может быть `null`/`undefined`.
 * @returns Новый объект — результат слияния.
 *
 * @throws {TypeError} Если `first` не объект.
 *
 * @example
 * deepMerge({ a: { b: 1 } }, { a: { c: 2 } })
 * // → { a: { b: 1, c: 2 } }
 *
 * @example
 * deepMerge({ x: 1 }, null)
 * // → { x: 1 }
 *
 * @since 0.4.0
 *
 **/
export function deepMerge<TFirst extends object, TSecond extends object | null | undefined>(
  first: TFirst,
  second: TSecond
): TSecond extends object ? DeepMerged<TFirst, TSecond> : TFirst

// Реализация
export function deepMerge(
  first: object,
  second: unknown
): object {

  if (!isObject(first)) {

    throw new TypeError('[deepMerge] first must be an object')

  }

  if (second == null || typeof second !== 'object')
    return first

  const output = { ...first }

  for (const key in second) {

    if (!hasOwn(second, key))
      continue

    const secondVal = second[key] as unknown
    const firstVal = output[key] as unknown

    if (isPlainObject(firstVal) && isPlainObject(secondVal)) {

      output[key] = deepMerge(firstVal, secondVal)

    }
    else {

      output[key] = secondVal

    }

  }

  return output

}
