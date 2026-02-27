import { ensureArray } from '#array/ensure-array';

describe('ensureArray', () => {

  describe('array inputs', () => {

    it('should return a copy of the input array', () => {

      const input = [1, 2, 3];
      const result = ensureArray(input);

      expect(result).toEqual([1, 2, 3]);
      expect(result).not.toBe(input); // Ссылки разные

    });

    it('should preserve object and array references inside the array', () => {

      const obj = { id: 1 };
      const arr = [1, 2];
      const input = [obj, arr];

      const result = ensureArray(input);

      expect(result).toEqual([obj, arr]);
      expect(result[0]).toBe(obj);
      expect(result[1]).toBe(arr);

    });

    it('should handle empty array', () => {

      const input: unknown[] = [];
      const result = ensureArray(input);

      expect(result).toEqual([]);
      expect(result).not.toBe(input);

    });

    it('should handle array with mixed types', () => {

      const date = new Date();
      const symbol = Symbol('test');
      const fn = () => {
        //
      };
      const input = ['a', 1, true, null, undefined, date, symbol, fn];

      const result = ensureArray(input);

      expect(result).toEqual(input);
      expect(result[3]).toBe(null);
      expect(result[4]).toBe(undefined);
      expect(result[5]).toBe(date);
      expect(result[7]).toBe(fn);

    });

    it('should not mutate the original array', () => {

      const original = [1, 2, 3];
      const result = ensureArray(original);

      result.push(4);
      expect(original).toEqual([1, 2, 3]);
      expect(result).toEqual([1, 2, 3, 4]);

    });

    it('should handle nested arrays', () => {

      const nested = [[1, 2], [3, 4]];
      const result = ensureArray(nested);

      expect(result).toEqual([[1, 2], [3, 4]]);
      expect(result).not.toBe(nested);
      expect(result[0]).toBe(nested[0]);

    });

  });

  describe('single value inputs', () => {

    it('should wrap string in array', () => {

      const result = ensureArray('hello');
      expect(result).toEqual(['hello']);

    });

    it('should wrap number in array', () => {

      const result = ensureArray(42);
      expect(result).toEqual([42]);

    });

    it('should wrap negative number in array', () => {

      const result = ensureArray(-1);
      expect(result).toEqual([-1]);

    });

    it('should wrap boolean in array', () => {

      const result = ensureArray(true);
      expect(result).toEqual([true]);

    });

    it('should wrap null in array', () => {

      const result = ensureArray(null);
      expect(result).toEqual([null]);

    });

    it('should wrap undefined in array', () => {

      const result = ensureArray(undefined);
      expect(result).toEqual([undefined]);

    });

    it('should wrap object in array', () => {

      const obj = { key: 'value' };
      const result = ensureArray(obj);
      expect(result).toEqual([obj]);
      expect(result[0]).toBe(obj);

    });

    it('should wrap array-like object in array', () => {

      const arrayLike = { 0: 'a', 1: 'b', length: 2 };
      const result = ensureArray(arrayLike);
      expect(result).toEqual([arrayLike]);

    });

    it('should wrap function in array', () => {

      const fn = () => {
        //
      };

      const result = ensureArray(fn);
      expect(result).toEqual([fn]);

    });

    it('should wrap symbol in array', () => {

      const sym = Symbol('id');
      const result = ensureArray(sym);
      expect(result).toEqual([sym]);

    });

    it('should wrap date in array', () => {

      const date = new Date();
      const result = ensureArray(date);
      expect(result).toEqual([date]);

    });

    it('should wrap empty string in array', () => {

      const result = ensureArray('');
      expect(result).toEqual(['']);

    });

    it('should wrap zero in array', () => {

      const result = ensureArray(0);
      expect(result).toEqual([0]);

    });

    it('should wrap NaN in array', () => {

      const result = ensureArray(NaN);
      expect(result).toEqual([NaN]);

    });

  });

  describe('type safety with generics', () => {

    it('should maintain type information for interface', () => {

      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: 'John' };
      const result = ensureArray<User>(user);

      expect(result).toEqual([user]);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('John');

    });

    it('should work with union types', () => {

      type Config = { type: 'a'; a: number } | { type: 'b'; b: string };

      const config: Config = { type: 'a', a: 42 };
      const result = ensureArray<Config>(config);

      expect(result).toEqual([config]);
      expect(result[0].type).toBe('a');

    });

    it('should preserve readonly arrays', () => {

      const input = [1, 2, 3] as const; // readonly [1, 2, 3]
      const result = ensureArray(input);

      expect(result).toEqual([1, 2, 3]);
      // TypeScript должен сохранить тип readonly при выводе

    });

    it('should work with complex nested types', () => {

      interface Tree {
        value: number;
        children?: Tree[];
      }

      const tree: Tree = {
        value: 1,
        children: [{ value: 2 }, { value: 3 }],
      };

      const result = ensureArray<Tree>(tree);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(1);
      expect(result[0].children).toHaveLength(2);

    });

  });

  describe('edge cases', () => {

    it('should handle empty object as single item', () => {

      const obj = {};
      const result = ensureArray(obj);
      expect(result).toEqual([{}]);
      expect(result[0]).toBe(obj);

    });

    it('should handle deeply nested structures', () => {

      const nested = { a: { b: { c: [1, 2] } } };
      const result = ensureArray(nested);
      expect(result).toEqual([nested]);

    });

    it('should handle function returning array', () => {

      const fn = () => [1, 2, 3];
      const result = ensureArray(fn);
      expect(result).toEqual([fn]);

    });

    it('should handle regex', () => {

      const regex = /test/;
      const result = ensureArray(regex);
      expect(result).toEqual([regex]);

    });

    it('should handle promise', () => {

      const promise = Promise.resolve(42);
      const result = ensureArray(promise);
      expect(result).toEqual([promise]);

    });

    it('should handle Map and Set', () => {

      const map = new Map([['a', 1]]);
      const set = new Set([1, 2]);
      const result = ensureArray([map, set]);

      expect(result).toEqual([map, set]);
      expect(result[0]).toBe(map);
      expect(result[1]).toBe(set);

    });

    it('should handle custom class instance', () => {

      class MyClass {
        value = 'test';
      }
      const instance = new MyClass();
      const result = ensureArray(instance);

      expect(result).toEqual([instance]);
      expect(result[0].value).toBe('test');

    });

  });

});
