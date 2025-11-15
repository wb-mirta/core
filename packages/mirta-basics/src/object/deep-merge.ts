import { isObject, isPlainObject } from '../guards'
import { hasOwn } from './helpers'

/**
 * Результат рекурсивного объединения `TBase` и `TPatch`.
 * Поля из `TPatch` переопределяют поля из `TBase`.
 * Вложенные объекты объединяются, остальные значения — заменяются.
 *
 * @template TBase - Тип базового объекта.
 * @template TPatch - Тип объекта с изменениями.
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
  : TBase

/**
 * Рекурсивно объединяет базовый объект с патчем.
 *
 * - Вложенные объекты — объединяются,
 * - Массивы, примитивы — заменяются целиком,
 * - Не мутирует аргументы `base` и `patch`,
 * - Если `patch` равен `null` или `undefined`, возвращает копию `base`.
 *
 * Для поверхностного объединения используйте {@link merge}.
 *
 * @param base - Объект, с которого начинается объединение.
 * @param patch - Набор изменений (допускает `null` или `undefined`).
 * @returns Новый объект — результат объединения.
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
): DeepMerged<TBase, TPatch>

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
