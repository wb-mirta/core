import { compactArray } from '#array/compact-array'

describe('compactArray', () => {

  describe('array processing', () => {

    it('should filter out falsy values from an array', () => {

      const input = [1, null, 2, undefined, 3, false, 4]
      const result = compactArray(input)

      expect(result).toEqual([1, 2, 3, 4])

    })

    it('should return an empty array for an array of falsy values', () => {

      const input = [null, undefined, false]
      const result = compactArray(input)

      expect(result).toEqual([])

    })

    it('should retain all elements if no falsy values exist', () => {

      const input = [1, 2, 3, 4]
      const result = compactArray(input)

      expect(result).toEqual([1, 2, 3, 4])

    })

    it('should handle empty arrays', () => {

      const result = compactArray([])

      expect(result).toEqual([])

    })

    it('should process string arrays with falsy values', () => {

      const input = ['hello', null, 'world', undefined, false]
      const result = compactArray(input)

      expect(result).toEqual(['hello', 'world'])

    })

    it('should process object arrays with falsy values', () => {

      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const input = [obj1, null, obj2, undefined]
      const result = compactArray(input)

      expect(result).toEqual([obj1, obj2])

    })

    it('should filter 0 and empty strings (falsy values)', () => {

      const input = [1, 0, '', 'test', null]
      const result = compactArray(input)

      // Boolean(0) === false, Boolean('') === false - these are filtered out
      expect(result).toEqual([1, 'test'])

    })

  })

  describe('single value processing', () => {

    it('should return an array with the element for truthy values', () => {

      expect(compactArray('test')).toEqual(['test'])
      expect(compactArray(42)).toEqual([42])
      expect(compactArray(true)).toEqual([true])
      expect(compactArray({ key: 'value' })).toEqual([{ key: 'value' }])

    })

    it('should return an empty array for null', () => {

      const result = compactArray(null)

      expect(result).toEqual([])

    })

    it('should return an empty array for undefined', () => {

      const result = compactArray(undefined)

      expect(result).toEqual([])

    })

    it('should return an empty array for false', () => {

      const result = compactArray(false)

      expect(result).toEqual([])

    })

  })

  describe('type checking', () => {

    it('should work correctly with generic types', () => {

      interface TestItem {
        id: number
        name: string
      }

      const item: TestItem = { id: 1, name: 'test' }
      const result = compactArray<TestItem>([item, null, undefined])

      expect(result).toEqual([item])
      expect(result[0]?.id).toBe(1)

    })

    it('should handle union types', () => {

      const input: (string | number | null)[] = ['hello', 42, null, 'world']
      const result = compactArray(input)

      expect(result).toEqual(['hello', 42, 'world'])

    })

  })

})
