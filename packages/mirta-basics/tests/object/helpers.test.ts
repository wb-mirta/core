import { hasOwn } from '#src/object/helpers';

describe('hasOwn', () => {

  describe('own properties', () => {

    it('should return true for own properties', () => {

      const obj = { key: 'value' };
      expect(hasOwn(obj, 'key')).toBe(true);

    });

    it('should return true for properties with undefined value', () => {

      const obj = { key: undefined };
      expect(hasOwn(obj, 'key')).toBe(true);

    });

    it('should return true for properties with null value', () => {

      const obj = { key: null };
      expect(hasOwn(obj, 'key')).toBe(true);

    });

    it('should return true for numeric properties', () => {

      const obj = { 0: 'zero', 1: 'one' };

      expect(hasOwn(obj, '0')).toBe(true);
      expect(hasOwn(obj, '1')).toBe(true);

    });

    it('should return true for symbol-named properties', () => {

      const sym = Symbol('test');
      const obj = { [sym]: 'value' };

      expect(hasOwn(obj, sym)).toBe(true);

    });

  });

  describe('inherited properties', () => {

    it('should return false for inherited properties', () => {

      const obj = { key: 'value' };
      expect(hasOwn(obj, 'toString')).toBe(false);
      expect(hasOwn(obj, 'hasOwnProperty')).toBe(false);
      expect(hasOwn(obj, 'constructor')).toBe(false);

    });

    it('should return false for properties from custom prototype', () => {

      const proto = { inherited: 'value' };

      const obj = Object.create(proto) as never;

      Object.defineProperty(obj, 'own', {
        value: 'own value',
        enumerable: true,
      });

      expect(hasOwn(obj, 'own')).toBe(true);
      expect(hasOwn(obj, 'inherited')).toBe(false);

    });

    it('should handle prototype chain correctly', () => {

      const grandProto = { grand: 'grand' };

      const proto = Object.create(grandProto) as never;

      Object.defineProperty(proto, 'parent', {
        value: 'parent',
        enumerable: true,
      });

      const obj = Object.create(proto) as never;

      Object.defineProperty(obj, 'own', {
        value: 'own',
        enumerable: true,
      });

      expect(hasOwn(obj, 'own')).toBe(true);
      expect(hasOwn(obj, 'parent')).toBe(false);
      expect(hasOwn(obj, 'grand')).toBe(false);

    });

  });

  describe('non-existent properties', () => {

    it('should return false for non-existent properties', () => {

      const obj = { key: 'value' };
      expect(hasOwn(obj, 'nonExistent')).toBe(false);

    });

    it('should return false for empty objects', () => {

      const obj = {};
      expect(hasOwn(obj, 'any')).toBe(false);

    });

  });

  describe('special objects', () => {

    it('should work with arrays', () => {

      const arr = ['a', 'b', 'c'];
      expect(hasOwn(arr, '0')).toBe(true);
      expect(hasOwn(arr, '1')).toBe(true);
      expect(hasOwn(arr, 'length')).toBe(true);
      expect(hasOwn(arr, 'push')).toBe(false);

    });

    it('should work with objects created with Object.create(null)', () => {

      const obj = Object.create(null) as never;

      Object.defineProperty(obj, 'key', {
        value: 'value',
        enumerable: true,
      });

      expect(hasOwn(obj, 'key')).toBe(true);
      expect(hasOwn(obj, 'toString')).toBe(false);

    });

    it('should work with class instances', () => {

      class MyClass {
        constructor(public ownProp: string) {
        }

        method() {
          /* empty */
        }
      }

      const instance = new MyClass('value');

      expect(hasOwn(instance, 'ownProp')).toBe(true);
      expect(hasOwn(instance, 'method')).toBe(false);

    });

    it('should work with Date objects', () => {

      const date = new Date();
      expect(hasOwn(date, 'getTime')).toBe(false);

    });

  });

  describe('edge cases', () => {

    it('should handle properties added after object creation', () => {

      const obj = {} as never;

      expect(hasOwn(obj, 'newProp')).toBe(false);

      Object.defineProperty(obj, 'newProp', {
        value: 1,
        enumerable: true,
      });

      expect(hasOwn(obj, 'newProp')).toBe(true);

    });

    it('should handle deleted properties', () => {

      const obj: { key?: string } = { key: 'value' };

      expect(hasOwn(obj, 'key')).toBe(true);

      delete obj.key;
      expect(hasOwn(obj, 'key')).toBe(false);

    });

    it('should work with objects having boolean properties', () => {

      const obj = { true: 'yes', false: 'no' };
      expect(hasOwn(obj, 'true')).toBe(true);
      expect(hasOwn(obj, 'false')).toBe(true);

    });

  });

});
