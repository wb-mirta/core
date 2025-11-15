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
 * Заменяет свойства из `TBase` на свойства из `TPatch` по ключам.
 * Оставляет несовпадающие свойства из `TBase`, добавляет новые из `TPatch`.
 *
 * Эквивалент `Omit<TBase, keyof TPatch> & TPatch`, но с `Expand`.
 *
 * @template TBase - Базовый тип.
 * @template TPatch - Тип с переопределяющими полями.
 *
 * @since 0.4.0
 *
 **/
type Overwrite<TBase, TPatch> = Expand<Omit<TBase, keyof TPatch> & TPatch>

/**
 * Рекурсивно вычисляет тип результата слияния кортежа объектов слева направо.
 * Игнорирует `null` и `undefined`, объединяя только объекты.
 * Поля из правых объектов переопределяют поля из левых.
 *
 * @template TList - readonly кортеж из объектов, `null` или `undefined`.
 *
 * @since 0.4.0
 *
 **/
type MergeList<TList>
  = TList extends readonly [infer Head, ...infer Tail]
    ? Head extends IsObject<Head>
      ? Expand<Overwrite<MergeList<Tail>, Head>>
      : MergeList<Tail>
    : {}

/**
 * Тип результата `merge`: объединение списка объектов с приоритетом правых полей.
 * Поля из последующих объектов переопределяют уже существующие.
 *
 * @template TList - Кортеж аргументов типа `(object | null | undefined)[]`.
 * @returns Итоговый тип после поверхностного слияния.
 *
 * @example
 *
 * ```ts
 * type Result = Merged<[{ a: 1 }, { a: 2; b: 2 }]>
 * // → { a: 2; b: 2 }
 * ```
 * @since 0.4.0
 *
 **/
export type Merged<TList> = Expand<MergeList<TList>>

/**
 * Поверхностно копирует значения всех собственных перечисляемых свойств
 * из одного и более исходных объектов в новый.
 *
 * Поля последующих объектов переопределяют предыдущие.
 *
 * Особенности:
 * - Игнорирует `null` и `undefined` в списке аргументов,
 * - Не мутирует исходные объекты.
 *
 * Для рекурсивного объединения вложенных свойств используйте {@link deepMerge}.
 *
 * @param objects - Список исходных объектов.
 * @returns Новый объект — результат объединения.
 *
 * @example
 *
 * ```ts
 * const a = { x: 1, y: 2 }
 * const b = null
 * const c = { y: 3, z: 4 }
 *
 * const result = merge(a, b, c)
 * // → { x: 1, y: 3, z: 4 }
 * ```
 * @example
 *
 * ```ts
 * merge({ a: 1 }, { a: 2 }, { a: undefined })
 * // → { a: undefined }
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

export function merge(...objects: readonly (object | null | undefined)[]): object {

  if (objects.length === 0)
    return {}

  return objects.reduce<Record<string, unknown>>(
    (base, patch) => (patch ? { ...base, ...patch } : base),
    {}
  )

}
