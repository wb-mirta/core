/**
 * Проверяет, является ли тип настоящим объектом (не `null`, не примитив).
 * Фильтрует `null`, так как `null extends object` в TS.
 *
 * @template T - Входной тип.
 *
 * @since 0.4.0
 *
 **/
type IsObject<TValue> = TValue extends object
  ? (TValue extends null ? never : TValue)
  : never

/**
 * Полностью заменяет свойства из `TFirst` на свойства из `TSecond`.
 * Эквивалент `Omit<TFirst, keyof TSecond> & TSecond`, но с `Expand`.
 *
 * @template TFirst - Базовый тип.
 * @template TSecond - Тип с переопределяющими полями.
 *
 * @since 0.4.0
 *
 **/
type Overwrite<TFirst, TSecond> = Expand<Omit<TFirst, keyof TSecond> & TSecond>

type MergeAll<TList>
  = TList extends readonly [infer Head, ...infer Tail]
    ? Head extends IsObject<Head>
      ? Expand<Overwrite<MergeAll<Tail>, Head>>
      : MergeAll<Tail>
    : {}

/**
 * Тип результата `merge`: объединение списка объектов с приоритетом правых полей.
 * Используется для вывода типа при вызове `merge(a, b, c)`.
 *
 * @template TList - Кортеж аргументов типа `(object | null | undefined)[]`.
 * @returns Итоговый тип после поверхностного слияния.
 *
 * @example
 * type Result = Merged<[{ a: 1 }, { a: 2; b: 2 }]>
 * // → { a: 2; b: 2 }
 *
 * @since 0.4.0
 *
 **/
export type Merged<TList> = Expand<MergeAll<TList>>

/**
 * Поверхностно объединяет объекты слева направо:
 * если у нескольких объектов есть свойство с одинаковым ключом, побеждает значение из самого правого.
 *
 * - `null` и `undefined` игнорируются.
 * - Не изменяет исходные объекты.
 * - Возвращает новый объект.
 *
 * @param objects - Список объектов для объединения. Может включать `null`/`undefined`.
 * @returns Новый объект, в котором поля из правых аргументов побеждают.
 *
 * @example
 *
 * ```ts
 * const a = { x: 1, y: 2 }
 * const b = { y: 3, z: 4 }
 * const c = null
 *
 * const result = merge(a, b, c)
 * // → { x: 1, y: 3, z: 4 }
 * ```
 * @example
 *
 * ```ts
 * merge({ a: 1 }, { a: 2 }, { a: 3 })
 * // → { a: 3 }
 * ```
 * @example
 *
 * ```ts
 * merge()
 * // → {}
 * ```
 * @since 0.4.0
 *
 **/
export function merge<TList extends readonly (object | null | undefined)[]>(
  ...objects: TList
): Merged<TList>

export function merge(...objects: (object | null | undefined)[]): object {

  if (objects.length === 0)
    return {}

  return objects.reduce<Record<string, unknown>>(
    (acc, nextItem) => (nextItem ? { ...acc, ...nextItem } : acc),
    {}
  )

}
