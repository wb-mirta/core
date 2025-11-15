import { deepMerge } from '#src/object/deep-merge'

describe('deepMerge', () => {

  describe('basic merging', () => {

    it('should merge two plain objects', () => {

      const base = { a: 1, b: 2 }
      const patch = { b: 3, c: 4 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 1, b: 3, c: 4 })

    })

    it('should not mutate the base object', () => {

      const base = { a: 1, b: 2 }
      const patch = { b: 3 }
      deepMerge(base, patch)

      expect(base).toEqual({ a: 1, b: 2 })

    })

    it('should not mutate the patch object', () => {

      const base = { a: 1 }
      const patch = { b: 2 }
      deepMerge(base, patch)

      expect(patch).toEqual({ b: 2 })

    })

  })

  describe('nested object merging', () => {

    it('should recursively merge nested plain objects', () => {

      const base = { a: { b: 1, c: 2 } }
      const patch = { a: { c: 3, d: 4 } }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } })

    })

    it('should merge deeply nested objects', () => {

      const base = { a: { b: { c: 1, d: 2 } } }
      const patch = { a: { b: { d: 3, e: 4 } } }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: { b: { c: 1, d: 3, e: 4 } } })

    })

    it('should merge multiple nested levels', () => {

      const base = {
        level1: {
          level2: {
            level3: { a: 1, b: 2 },
          },
        },
      }
      const patch = {
        level1: {
          level2: {
            level3: { b: 3, c: 4 },
          },
        },
      }
      const result = deepMerge(base, patch)

      expect(result).toEqual({
        level1: {
          level2: {
            level3: { a: 1, b: 3, c: 4 },
          },
        },
      })

    })

  })

  describe('non-plain object handling', () => {

    it('should replace arrays instead of merging them', () => {

      const base = { arr: [1, 2, 3] }
      const patch = { arr: [4, 5] }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ arr: [4, 5] })

    })

    it('should replace Date objects', () => {

      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-12-31')
      const base = { date: date1 }
      const patch = { date: date2 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ date: date2 })

    })

    it('should replace functions', () => {

      const fn1 = () => 1
      const fn2 = () => 2
      const base = { fn: fn1 }
      const patch = { fn: fn2 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ fn: fn2 })

    })

    it('should replace RegExp objects', () => {

      const base = { regex: /foo/g }
      const patch = { regex: /bar/i }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ regex: /bar/i })

    })

  })

  describe('primitive value replacement', () => {

    it('should replace primitive values', () => {

      const base = { a: 1, b: 'hello', c: true }
      const patch = { a: 2, b: 'world', c: false }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 2, b: 'world', c: false })

    })

    it('should replace object with primitive', () => {

      const base = { a: { b: 1 } }
      const patch = { a: 42 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 42 })

    })

    it('should replace primitive with object', () => {

      const base = { a: 42 }
      const patch = { a: { b: 1 } }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: { b: 1 } })

    })

  })

  describe('null and undefined handling', () => {

    it('should return a copy of base when patch is null', () => {

      const base = { a: 1, b: 2 }
      const result = deepMerge(base, null)

      expect(result).toEqual({ a: 1, b: 2 })
      expect(result).not.toBe(base)

    })

    it('should return a copy of base when patch is undefined', () => {

      const base = { a: 1, b: 2 }
      const result = deepMerge(base, undefined)

      expect(result).toEqual({ a: 1, b: 2 })
      expect(result).not.toBe(base)

    })

    it('should handle null values in patch', () => {

      const base = { a: 1, b: 2 }
      const patch = { a: null, c: 3 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: null, b: 2, c: 3 })

    })

    it('should handle undefined values in patch', () => {

      const base = { a: 1, b: 2 }
      const patch = { a: undefined, c: 3 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: undefined, b: 2, c: 3 })

    })

  })

  describe('edge cases', () => {

    it('should handle empty objects', () => {

      const result = deepMerge({}, {})
      expect(result).toEqual({})

    })

    it('should merge when base is empty', () => {

      const base = {}
      const patch = { a: 1, b: 2 }
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 1, b: 2 })

    })

    it('should return copy of base when patch is empty', () => {

      const base = { a: 1, b: 2 }
      const patch = {}
      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 1, b: 2 })
      expect(result).not.toBe(base)

    })

    it('should handle objects with Object.create(null)', () => {

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

      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 1, b: 2 })

    })

    it('should only iterate own properties of patch', () => {

      const base = { a: 1 }
      const proto = { inherited: 'value' }

      const patch = Object.create(proto) as never

      Object.defineProperty(patch, 'b', {
        value: 2,
        enumerable: true,
      })

      const result = deepMerge(base, patch)

      expect(result).toEqual({ a: 1, b: 2 })
      expect('inherited' in result).toBe(false)

    })

  })

  describe('error handling', () => {

    it('should throw TypeError when base is not an object', () => {

      expect(() => deepMerge(null as never, {})).toThrow(TypeError)
      expect(() => deepMerge(null as never, {})).toThrow('[deepMerge] first argument must be an object')

    })

    it('should throw TypeError for primitive base values', () => {

      expect(() => deepMerge(42 as never, {})).toThrow(TypeError)
      expect(() => deepMerge('string' as never, {})).toThrow(TypeError)
      expect(() => deepMerge(true as never, {})).toThrow(TypeError)
      expect(() => deepMerge(undefined as never, {})).toThrow(TypeError)

    })

  })

  describe('complex scenarios', () => {

    it('should handle mixed nested structures', () => {

      const base = {
        obj: { a: 1 },
        arr: [1, 2],
        prim: 'hello',
        nested: {
          deep: { value: 1 },
        },
      }
      const patch = {
        obj: { b: 2 },
        arr: [3, 4, 5],
        prim: 'world',
        nested: {
          deep: { value: 2, extra: 3 },
        },
      }
      const result = deepMerge(base, patch)

      expect(result).toEqual({
        obj: { a: 1, b: 2 },
        arr: [3, 4, 5],
        prim: 'world',
        nested: {
          deep: { value: 2, extra: 3 },
        },
      })

    })

    it('should preserve reference independence', () => {

      const base = { nested: { value: 1 } }
      const patch = { nested: { other: 2 } }
      const result = deepMerge(base, patch)

      result.nested.value = 999
      expect(base.nested.value).toBe(1)
      expect(patch.nested.other).toBe(2)

    })

  })

})
