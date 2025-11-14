import { isObject, isPlainObject } from '../guards'
import { hasOwn } from './helpers'

/**
 * Рекурсивно объединяет свойства источника (`source`) с целевым объектом (`target`).
 *
 * - Объекты объединяются рекурсивно.
 * - Массивы и другие значения (включая функции) заменяются целиком — не сливаются.
 * - Не изменяет исходные объекты — возвращает новый объект.
 *
 * @param target - Целевой объект, в который происходит слияние. Должен быть объектом.
 * @param source - Источник данных для слияния. Если не является объектом, возвращается `target` без изменений.
 * @returns Новый объект, полученный путём глубокого слияния `target` и `source`.
 *
 * @throws {TypeError} Если `target` не является объектом.
 *
 * @example
 * Объекты объединяются рекурсивно:
 * ```ts
 * deepMerge({ a: { b: 1 } }, { a: { c: 2 } })
 * // → { a: { b: 1, c: 2 } }
 * ```
 * @example
 * Массивы заменяются целиком:
 * ```ts
 * deepMerge({ arr: [1, 2] }, { arr: [3, 4] })
 * // → { arr: [3, 4] }
 * ```
 * @example
 * Примитивы и функции заменяются:
 * ```ts
 * const fn1 = () => {}
 * const fn2 = () => {}
 * deepMerge({ fn: fn1 }, { fn: fn2 })
 * // → { fn: fn2 }
 * ```
 * @since 0.4.0
 *
 **/
export function deepMerge<TTarget extends object = object>(
  target: TTarget,
  source: unknown
): TTarget {

  if (!isObject(target))
    throw new TypeError('[deepMerge] target must be an object')

  if (source == null || typeof source !== 'object')
    return target

  const output = { ...target }

  for (const key in source) {

    if (!hasOwn(source, key))
      continue

    const sourceVal = source[key] as unknown
    const targetVal = output[key] as unknown

    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {

      output[key] = deepMerge(targetVal, sourceVal)

    }
    else {

      output[key] = sourceVal

    }

  }

  return output

}
