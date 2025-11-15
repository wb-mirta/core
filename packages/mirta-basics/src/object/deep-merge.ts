import { isObject, isPlainObject } from '../guards'
import { hasOwn } from './helpers'

/**
 * Рекурсивно объединяет типы. Поля из `TPatch` побеждают.
 * Вложенные объекты сливаются, прочие значения — заменяются.
 *
 * @template TBase - Тип объекта, с которого начинается слияние.
 * @template TPatch - Тип объекта с изменениями (может быть `null` или `undefined`).
 *
 * @since 0.4.0
 *
 **/
export type DeepMerged<TBase, TPatch> = [TBase, TPatch] extends [object, object]
  ? {
      [K in keyof TBase | keyof TPatch]: K extends keyof TPatch
        ? TPatch[K] extends object
          ? K extends keyof TBase
            ? TBase[K] extends object
              ? DeepMerged<TBase[K], TPatch[K]>
              : TPatch[K]
            : TPatch[K]
          : TPatch[K]
        : K extends keyof TBase
          ? TBase[K]
          : never
    }
  : TPatch

/**
 * Рекурсивно объединяет базовый объект с патчем. Не изменяет исходные.
 *
 * - Вложенные объекты — сливаются.
 * - Массивы, примитивы — заменяются целиком.
 * - Если `patch` — `null`/`undefined`, возвращается копия `base`.
 *
 * @param base - Объект, с которого начинается слияние.
 * @param patch - Объект с изменениями (может быть `null` или `undefined`).
 * @returns Новый объект — результат слияния.
 *
 * @throws {TypeError} Если `base` не является объектом.
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
export function deepMerge<TBase extends object, TPatch extends object | null | undefined>(
  base: TBase,
  patch: TPatch
): TPatch extends object ? DeepMerged<TBase, TPatch> : TBase

export function deepMerge(
  base: object,
  patch: unknown
): object {

  if (!isObject(base))
    throw new TypeError('[deepMerge] first argument must be an object')

  const output = { ...base }

  if (patch == null || typeof patch !== 'object')
    return output

  for (const key in patch) {

    if (!hasOwn(patch, key))
      continue

    const fromBase = output[key] as unknown
    const fromPatch = patch[key] as unknown

    if (isPlainObject(fromBase) && isPlainObject(fromPatch)) {

      output[key] = deepMerge(fromBase, fromPatch)

    }
    else {

      output[key] = fromPatch

    }

  }

  return output

}
