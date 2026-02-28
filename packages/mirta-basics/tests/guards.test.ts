/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-empty-function */

import { isString, isNumber, isBoolean, isFunction, isObject, isPlainObject } from '#src/guards';

describe('guards', () => {

  describe('isString', () => {

    it('should return true for string primitives', () => {

      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('123')).toBe(true);

    });

    it('should return false for non-string values', () => {

      expect(isString(123)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString(() => {
      })).toBe(false);

    });

    it('should return false for String objects', () => {

      expect(isString(new String('hello'))).toBe(false);

    });

  });

  describe('isNumber', () => {

    it('should return true for number primitives', () => {

      expect(isNumber(42)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-10)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);

    });

    it('should return false for NaN', () => {

      expect(isNumber(NaN)).toBe(false);

    });

    it('should return false for non-number values', () => {

      expect(isNumber('42')).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);

    });

    it('should return false for Number objects', () => {

      expect(isNumber(new Number(42))).toBe(false);

    });

  });

  describe('isBoolean', () => {

    it('should return true for boolean primitives', () => {

      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);

    });

    it('should return false for non-boolean values', () => {

      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean('false')).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean({})).toBe(false);
      expect(isBoolean([])).toBe(false);

    });

    it('should return false for Boolean objects', () => {

      expect(isBoolean(new Boolean(true))).toBe(false);

    });

  });

  describe('isFunction', () => {

    it('should return true for functions', () => {

      expect(isFunction(() => {
      })).toBe(true);

      expect(isFunction(function () {
      })).toBe(true);

      expect(isFunction(function named() {
      })).toBe(true);

      expect(isFunction(Math.max)).toBe(true);
      expect(isFunction(Array.prototype.push)).toBe(true);

    });

    it('should return true for classes', () => {

      expect(isFunction(class {
      })).toBe(true);

      expect(isFunction(Date)).toBe(true);

    });

    it('should return true for async functions', () => {

      expect(isFunction(async () => {
      })).toBe(true);

      expect(isFunction(async function () {
      })).toBe(true);

    });

    it('should return true for generator functions', () => {

      expect(isFunction(function* () {
      })).toBe(true);

    });

    it('should return false for non-function values', () => {

      expect(isFunction({})).toBe(false);
      expect(isFunction('function')).toBe(false);
      expect(isFunction(42)).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction([])).toBe(false);

    });

  });

  describe('isObject', () => {

    it('should return true for plain objects', () => {

      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);

    });

    it('should return true for arrays', () => {

      expect(isObject([])).toBe(true);
      expect(isObject([1, 2, 3])).toBe(true);

    });

    it('should return true for built-in object types', () => {

      expect(isObject(new Date())).toBe(true);
      expect(isObject(new RegExp(''))).toBe(true);
      expect(isObject(new Error())).toBe(true);
      expect(isObject(new Map())).toBe(true);
      expect(isObject(new Set())).toBe(true);

    });

    it('should return false for functions', () => {

      expect(isObject(() => {
      })).toBe(false);

      expect(isObject(function () {
      })).toBe(false);

      expect(isObject(class {
      })).toBe(false);

    });

    it('should return false for null', () => {

      expect(isObject(null)).toBe(false);

    });

    it('should return false for primitives', () => {

      expect(isObject('hello')).toBe(false);
      expect(isObject(42)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(undefined)).toBe(false);

    });

  });

  describe('isPlainObject', () => {

    it('should return true for plain objects', () => {

      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1, b: 2 })).toBe(true);

    });

    it('should return true for objects created with Object.create(null)', () => {

      expect(isPlainObject(Object.create(null))).toBe(true);

    });

    it('should return false for objects created with Object.create({})', () => {

      expect(isPlainObject(Object.create({}))).toBe(false);

    });

    it('should return false for arrays', () => {

      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject([1, 2, 3])).toBe(false);

    });

    it('should return false for built-in object types', () => {

      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new RegExp(''))).toBe(false);
      expect(isPlainObject(new Error())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(new Set())).toBe(false);

    });

    it('should return false for class instances', () => {

      class MyClass {
      }

      expect(isPlainObject(new MyClass())).toBe(false);

    });

    it('should return false for functions', () => {

      expect(isPlainObject(() => {
      })).toBe(false);

      expect(isPlainObject(function () {
      })).toBe(false);

    });

    it('should return false for primitives', () => {

      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject('hello')).toBe(false);
      expect(isPlainObject(42)).toBe(false);
      expect(isPlainObject(true)).toBe(false);

    });

  });

});
