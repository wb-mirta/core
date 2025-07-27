// Object.values() is part of the ES8 (June 2017) specification.
if (typeof Object.values != 'function') {

  Object.defineProperty(Object, 'values', {
    value: function values<T>(o: Record<string, T> | ArrayLike<T>) {

      return Object.keys(o).map(k => o[k] as T)

    },
    writable: true,
    configurable: true,
  })

}
