/**
 * Проверяет, содержит ли объект указанное собственное свойство.
 *
 * Метод обходит цепочку прототипов и возвращает `true` только в том случае,
 * если свойство существует непосредственно в самом объекте, а не унаследовано.
 *
 * @param target - Объект, в котором выполняется проверка.
 * @param key - Имя свойства, которое необходимо проверить.
 * @returns `true`, если объект имеет указанное собственное свойство; иначе `false`.
 *
 * @example
 *
 * ```ts
 * const obj = { key: 'value' };
 * hasOwn(obj, 'key');      // true
 * hasOwn(obj, 'toString'); // false (унаследованное свойство)
 * ```
 *
 * @since 0.4.0
 *
 **/
export function hasOwn(target: object, key: string): boolean {

  return Object.prototype.hasOwnProperty
    .call(target, key) as boolean

}
