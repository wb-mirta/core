import { ensureCompactArray } from '#array/ensure-compact-array';

describe('ensureCompactArray', () => {

  describe('array inputs', () => {

    it('should filter out all falsy values from array', () => {

      const input = ['a', false, 'b', null, 'c', undefined, '', 0];

      const result = ensureCompactArray(input);

      expect(result).toEqual(['a', 'b', 'c']);

    });

    it('should return all items when array has no falsy values', () => {

      const input = ['a', 'b', 'c', 1, 2, 3, true, {}];

      const result = ensureCompactArray(input);

      expect(result).toEqual(['a', 'b', 'c', 1, 2, 3, true, {}]);

    });

    it('should return empty array when all items are falsy', () => {

      const input = [false, null, undefined, '', 0, NaN];

      const result = ensureCompactArray(input);

      expect(result).toEqual([]);

    });

    it('should handle empty array input', () => {

      const result = ensureCompactArray([]);

      expect(result).toEqual([]);

    });

    it('should preserve truthy objects and arrays', () => {

      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      const input = [obj, false, arr, null, 'test'];

      const result = ensureCompactArray(input);

      expect(result).toEqual([obj, arr, 'test']);
      expect(result[0]).toBe(obj);
      expect(result[1]).toBe(arr);

    });

    it('should handle array with mixed types', () => {

      interface TestItem {
        id: number;
        name?: string;
      }

      const input: (TestItem | false | null | undefined)[] = [
        { id: 1, name: 'first' },
        false,
        { id: 2 },
        null,
        { id: 3, name: 'third' },
        undefined,
      ];

      const result = ensureCompactArray<TestItem>(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 1, name: 'first' });
      expect(result[1]).toEqual({ id: 2 });
      expect(result[2]).toEqual({ id: 3, name: 'third' });

    });

    it('should filter NaN values', () => {

      const input = [1, NaN, 2, NaN, 3];

      const result = ensureCompactArray(input);

      expect(result).toEqual([1, 2, 3]);
      expect(result).not.toContain(NaN);

    });

  });

  describe('single value inputs', () => {

    it('should wrap truthy string in array', () => {

      const result = ensureCompactArray('test');

      expect(result).toEqual(['test']);

    });

    it('should wrap truthy number in array', () => {

      const result = ensureCompactArray(42);

      expect(result).toEqual([42]);

    });

    it('should wrap negative number in array', () => {

      const result = ensureCompactArray(-5);

      expect(result).toEqual([-5]);

    });

    it('should wrap truthy object in array', () => {

      const obj = { key: 'value' };

      const result = ensureCompactArray(obj);

      expect(result).toEqual([obj]);
      expect(result[0]).toBe(obj);

    });

    it('should wrap true boolean in array', () => {

      const result = ensureCompactArray(true);

      expect(result).toEqual([true]);

    });

    it('should return empty array for false', () => {

      const result = ensureCompactArray(false);

      expect(result).toEqual([]);

    });

    it('should return empty array for null', () => {

      const result = ensureCompactArray(null);

      expect(result).toEqual([]);

    });

    it('should return empty array for undefined', () => {

      const result = ensureCompactArray(undefined);

      expect(result).toEqual([]);

    });

    it('should return empty array for empty string', () => {

      const result = ensureCompactArray('');

      expect(result).toEqual([]);

    });

    it('should return empty array for zero', () => {

      const result = ensureCompactArray(0);

      expect(result).toEqual([]);

    });

    it('should return empty array for NaN', () => {

      const result = ensureCompactArray(NaN);

      expect(result).toEqual([]);

    });

  });

  describe('type safety with generics', () => {

    it('should maintain type information for typed arrays', () => {

      interface User {
        id: number;
        name: string;
      }

      const input: (User | false | null)[] = [
        { id: 1, name: 'Alice' },
        false,
        { id: 2, name: 'Bob' },
        null,
      ];

      const result = ensureCompactArray<User>(input);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Alice');
      expect(result[1].id).toBe(2);
      expect(result[1].name).toBe('Bob');

    });

    it('should work with union types', () => {

      type Item = string | number;

      const input: (Item | false | undefined)[] = ['a', 1, false, 'b', 2, undefined];

      const result = ensureCompactArray<Item>(input);

      expect(result).toEqual(['a', 1, 'b', 2]);

    });

    it('should work with complex object types', () => {

      interface Config {
        key: string;
        value: number | string;
      }

      const input: (Config | null | undefined)[] = [
        { key: 'a', value: 1 },
        null,
        { key: 'b', value: 'text' },
        undefined,
      ];

      const result = ensureCompactArray<Config>(input);

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('a');
      expect(result[1].value).toBe('text');

    });

  });

  describe('edge cases', () => {

    it('should not mutate the original array', () => {

      const original = [1, null, 2];
      const result = ensureCompactArray(original);

      expect(result).toEqual([1, 2]);
      expect(original).toEqual([1, null, 2]); // Does not change

    });

    it('should handle array containing only undefined values', () => {

      const input = [undefined, undefined, undefined];

      const result = ensureCompactArray(input);

      expect(result).toEqual([]);

    });

    it('should handle array with nested arrays', () => {

      const input = [[1, 2], false, [3, 4], null, []];

      const result = ensureCompactArray(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual([1, 2]);
      expect(result[1]).toEqual([3, 4]);
      expect(result[2]).toEqual([]);

    });

    it('should preserve negative numbers', () => {

      const input = [-1, false, -2, null, -3];

      const result = ensureCompactArray(input);

      expect(result).toEqual([-1, -2, -3]);

    });

    it('should handle array with whitespace strings', () => {

      const input = ['a', ' ', 'b', '', 'c'];

      const result = ensureCompactArray(input);

      expect(result).toEqual(['a', ' ', 'b', 'c']);
      expect(result).not.toContain('');

    });

    it('should handle single truthy value in array', () => {

      const result = ensureCompactArray(['only']);

      expect(result).toEqual(['only']);

    });

    it('should handle single falsy value in array', () => {

      const result = ensureCompactArray([null]);

      expect(result).toEqual([]);

    });

  });

});
