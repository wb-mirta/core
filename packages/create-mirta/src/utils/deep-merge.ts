import { isObject } from './type-guards'

const mergeArrayWithDedupe = (a: unknown[], b: unknown[]) => Array.from(new Set([...a, ...b]))

/**
 * Recursively merge the content of the new object to the existing one
 * @param {Object} target the existing object
 * @param {Object} source the new object
 */
function deepMerge(target: object, source: object) {

  for (const key of Object.keys(source)) {

    const oldVal = target[key] as unknown
    const newVal = source[key] as unknown

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {

      target[key] = mergeArrayWithDedupe(oldVal, newVal)

    }
    else if (isObject(oldVal) && isObject(newVal)) {

      target[key] = deepMerge(oldVal, newVal)

    }
    else {

      target[key] = newVal

    }

  }

  return target

}

export default deepMerge
