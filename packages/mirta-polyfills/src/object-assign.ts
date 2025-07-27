// Object.assign() is part of the ES6 (June 2015) specification.
if (typeof Object.assign != 'function') {

  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, 'assign', {
    value: function assign<T extends object>(target?: T) { // .length of function is 2

      'use strict'
      if (target == null) { // TypeError if undefined or null

        throw new TypeError('Cannot convert undefined or null to object')

      }

      const to = Object(target) as T

      for (let index = 1; index < arguments.length; index++) {

        // eslint-disable-next-line prefer-rest-params
        const nextSource = arguments[index] as unknown

        if (nextSource != null) { // Skip over if undefined or null

          for (const nextKey in nextSource) {

            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {

              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              to[nextKey] = nextSource[nextKey]

            }

          }

        }

      }
      return to

    },
    writable: true,
    configurable: true,
  })

}
