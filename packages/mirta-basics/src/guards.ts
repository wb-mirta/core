/**
 * Проверяет, является ли переданное значение строковым примитивом (`string`).
 *
 * @param value - Значение, которое необходимо проверить.
 * @returns `true`, если значение является строкой (`string`), иначе `false`.
 *
 * @example
 * ```ts
 * isString('hello'); // true
 * isString(123);     // false
 * ```
 * @since 0.0.2
 *
 **/
export const isString = (value: unknown): value is string =>
  typeof value === 'string'

/**
 * Проверяет, является ли переданное значение числовым примитивом (`number`), не равным `NaN`.
 *
 * @param value - Значение, которое необходимо проверить.
 * @returns `true`, если значение является числом (`number`) и не является `NaN`, иначе `false`.
 *
 * @example
 * ```ts
 * isNumber(42)   // true
 * isNumber('42') // false
 * isNumber(NaN)  // false
 * ```
 * @since 0.0.2
 *
 **/
export const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && !isNaN(value)

/**
 * Проверяет, является ли переданное значение булевым примитивом (`boolean`).
 *
 * @param value - Значение, которое необходимо проверить.
 * @returns `true`, если значение является булевым примитивом (`true` или `false`), иначе `false`.
 *
 * @remarks
 * Не возвращает `true` для объектов `Boolean`, даже если они обёрнуты.
 *
 * @example
 *
 * ```ts
 * isBoolean(true)              // true
 * isBoolean(false)             // true
 * isBoolean(1)                 // false
 * isBoolean('true')            // false
 * isBoolean(new Boolean(true)) // false (это объект, не примитив)
 * ```
 * @since 0.0.2
 *
 **/
export function isBoolean(value: unknown): value is boolean {

  return typeof value === 'boolean'

}

/**
 * Проверяет, является ли переданное значение функцией.
 *
 * @param value - Значение, которое необходимо проверить.
 * @returns `true`, если значение является функцией (включая стрелочные функции, функции-объявления, методы и т.д.), иначе `false`.
 *
 * @example
 * ```ts
 * isFunction(() => {});      // true
 * isFunction(function() {}); // true
 * isFunction(Math.max);      // true
 * isFunction(class {});      // true (в JS классы — это функции)
 * isFunction({});            // false
 * isFunction('function');    // false
 * ```
 * @since 0.1.0
 *
 **/
export const isFunction = (value: unknown): value is ((...args: unknown[]) => unknown) =>
  typeof value === 'function'

/**
 * Проверяет, является ли значение объектом —
 * имеет тип `object` и не равно `null`.
 *
 * @remarks
 * Проходят массивы и все объектные типы, включая
 * встроенные (`Date`, `Map`, `Set`, `RegExp` и прочие).
 *
 * @param value - Проверяемое значение.
 * @returns `true`, если это объект.
 *
 * @example
 * ```ts
 * isObject({})       // true
 * isObject([])       // true
 *
 * isObject(() => {}) // false
 * isObject(null)     // false
 * isObject('hello')  // false
 * isObject(42)       // false
 * ```
 * @since 0.4.0
 */
export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object'

/**
 * Проверяет, является ли значение "обычным объектом" —
 * имеет прототип `Object.prototype` или `null`.
 *
 * @remarks
 * Не проходят массивы и встроенные типы (`Date`, `Map`, `Set`, `RegExp` и прочие).
 *
 * Не пройдёт и `Object.create({})`, т.к. экземпляр _унаследован_ от обычного объекта `{}`.
 *
 * @param value - Проверяемое значение.
 *
 * @returns `true`, если это обычный объект.
 *
 * @example
 * ```ts
 * isPlainObject({})                  // true
 * isPlainObject({ a: 1, b: 2 })      // true
 * isPlainObject(Object.create(null)) // true
 *
 * isPlainObject(Object.create({}))   // false
 * isPlainObject(new Date())          // false
 * isPlainObject(() => {})            // false
 * isPlainObject([])                  // false
 * ```
 * @since 0.4.0
 *
 **/
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {

  if (!isObject(value))
    return false

  const proto = Object.getPrototypeOf(value) as unknown

  return proto === null || proto === Object.prototype

}
