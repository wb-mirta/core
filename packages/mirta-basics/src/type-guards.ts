/** Сужает диапазон множества типов до string */
export const isString = (value: unknown): value is string =>
  typeof value === 'string'

/** Сужает диапазон множества типов до number */
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number'

/** Сужает диапазон множества типов до boolean */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean'
