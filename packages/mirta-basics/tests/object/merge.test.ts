import { merge } from '#src/object/merge'

describe('merge', () => {

  describe('basic merging', () => {

    it('should merge two objects', () => {

      const a = { x: 1, y: 2 }
      const b = { y: 3, z: 4 }
      const result = merge(a, b)

      expect(result).toEqual({ x: 1, y: 3, z: 4 })

    })

    it('should merge multiple objects left to right', () => {

      const a = { a: 1 }
      const b = { a: 2, b: 2 }
      const c = { a: 3, c: 3 }
      const result = merge(a, b, c)

      expect(result).toEqual({ a: 3, b: 2, c: 3 })

    })

    it('should not mutate input objects', () => {

      const a = { x: 1 }
      const b = { y: 2 }
      merge(a, b)

      expect(a).toEqual({ x: 1 })
      expect(b).toEqual({ y: 2 })

    })

    it('should return a new object', () => {

      const a = { x: 1 }
      const b = { y: 2 }
      const result = merge(a, b)

      expect(result).not.toBe(a)
      expect(result).not.toBe(b)

    })

  })

  describe('null and undefined handling', () => {

    it('should ignore null values', () => {

      const a = { x: 1 }
      const b = null
      const c = { y: 2 }
      const result = merge(a, b, c)

      expect(result).toEqual({ x: 1, y: 2 })

    })

    it('should ignore undefined values', () => {

      const a = { x: 1 }
      const b = undefined
      const c = { y: 2 }
      const result = merge(a, b, c)

      expect(result).toEqual({ x: 1, y: 2 })

    })

    it('should handle mixed null and undefined', () => {

      const result = merge({ a: 1 }, null, { b: 2 }, undefined, { c: 3 })
      expect(result).toEqual({ a: 1, b: 2, c: 3 })

    })

    it('should handle all null/undefined arguments', () => {

      const result = merge(null, undefined, null)
      expect(result).toEqual({})

    })

  })

  describe('edge cases', () => {

    it('should return empty object when called with no arguments', () => {

      const result = merge()
      expect(result).toEqual({})

    })

    it('should handle single object argument', () => {

      const obj = { a: 1, b: 2 }
      const result = merge(obj)

      expect(result).toEqual({ a: 1, b: 2 })
      expect(result).not.toBe(obj)

    })

    it('should handle empty objects', () => {

      const result = merge({}, {}, {})
      expect(result).toEqual({})

    })

    it('should merge objects with overlapping keys', () => {

      const result = merge(
        { a: 1, b: 2, c: 3 },
        { b: 20, c: 30 },
        { c: 300 }
      )
      expect(result).toEqual({ a: 1, b: 20, c: 300 })

    })

  })

  describe('value types', () => {

    it('should handle primitive values', () => {

      const result = merge(
        { str: 'hello', num: 42, bool: true },
        { str: 'world', num: 100, bool: false }
      )
      expect(result).toEqual({ str: 'world', num: 100, bool: false })

    })

    it('should handle null values in properties', () => {

      const result = merge({ a: 1 }, { a: null })
      expect(result).toEqual({ a: null })

    })

    it('should handle undefined values in properties', () => {

      const result = merge({ a: 1 }, { a: undefined })
      expect(result).toEqual({ a: undefined })

    })

    it('should perform shallow merge on nested objects', () => {

      const result = merge(
        { nested: { a: 1, b: 2 } },
        { nested: { b: 3, c: 4 } }
      )
      expect(result).toEqual({ nested: { b: 3, c: 4 } })

    })

    it('should replace arrays', () => {

      const result = merge(
        { arr: [1, 2, 3] },
        { arr: [4, 5] }
      )
      expect(result).toEqual({ arr: [4, 5] })

    })

    it('should replace functions', () => {

      const fn1 = () => 1
      const fn2 = () => 2
      const result = merge({ fn: fn1 }, { fn: fn2 })

      expect(result.fn).toBe(fn2)

    })

  })

  describe('complex scenarios', () => {

    it('should handle objects with many properties', () => {

      const base = { a: 1, b: 2, c: 3, d: 4 }
      const patch1 = { b: 20, e: 5 }
      const patch2 = { c: 30, f: 6 }
      const result = merge(base, patch1, patch2)

      expect(result).toEqual({ a: 1, b: 20, c: 30, d: 4, e: 5, f: 6 })

    })

    it('should work with objects created using Object.create(null)', () => {

      const base = Object.create(null) as never

      Object.defineProperty(base, 'a', {
        value: 1,
        enumerable: true,
      })

      const patch = Object.create(null) as never

      Object.defineProperty(patch, 'b', {
        value: 2,
        enumerable: true,
      })

      const result = merge(base, patch)

      expect(result).toEqual({ a: 1, b: 2 })

    })

    it('should maintain last value in chain of merges', () => {

      const result = merge(
        { key: 'first' },
        { key: 'second' },
        { key: 'third' },
        { key: 'fourth' }
      )
      expect(result).toEqual({ key: 'fourth' })

    })

  })

})
