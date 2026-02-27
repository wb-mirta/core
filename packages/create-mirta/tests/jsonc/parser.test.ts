import { JsoncContainer } from '#jsonc/index';
import { parseJsonc } from '#jsonc/parser';
import deepMerge from '#utils/deep-merge';

describe('parseJsonc', () => {

  it('should parse empty object', () => {

    const result = parseJsonc('{}');
    expect(result).toEqual({});

  });

  it('should parse object with string property', () => {

    const result = parseJsonc('{"name": "John"}');
    expect(result).toEqual({
      name: {
        value: 'John',
      },
    });

  });

  it('should parse object with numeric property', () => {

    const result = parseJsonc('{"age": 30}');
    expect(result).toEqual({
      age: {
        value: 30,
      },
    });

  });

  it('should parse object with boolean property', () => {

    const result = parseJsonc('{"active": true}');
    expect(result).toEqual({
      active: {
        value: true,
      },
    });

  });

  it('should parse object with null property', () => {

    const result = parseJsonc('{"value": null}');
    expect(result).toEqual({
      value: {
        value: null,
      },
    });

  });

  it('should parse nested objects', () => {

    const result = parseJsonc('{"user": {"name": "John", "age": 30}}');
    expect(result).toEqual({
      user: {
        value: {
          name: { value: 'John' },
          age: { value: 30 },
        },
      },
    });

  });

  it('should parse arrays', () => {

    const result = parseJsonc('{"list": [1, "two", true]}');

    expect(result).toEqual({
      list: {
        value: [
          { value: 1 },
          { value: 'two' },
          { value: true },
        ],
      },
    });

  });

  it('should parse array of objects', () => {

    const result = parseJsonc('{"items": [{"a": 1}, {"b": 2}]}');
    expect(result).toEqual({
      items: {
        value: [
          { value: { a: { value: 1 } } },
          { value: { b: { value: 2 } } },
        ],
      },
    });

  });

  it('should ignore single-line comments', () => {

    const text = `
// This is a comment
{ "name": "John" }
`;
    const result = parseJsonc(text);
    expect(result).toEqual({
      name: {
        value: 'John',
      },
    });

  });

  it('should ignore block comments', () => {

    const text = `
/* Comment
   on multiple lines */
{ "value": 42 }
`;
    const result = parseJsonc(text);
    expect(result).toEqual({
      value: {
        value: 42,
      },
    });

  });

  it('should attach comments to the next property', () => {

    const text = `
// Comment for name
"name": "Alice"
`;
    const result = parseJsonc(`{ ${text} }`);
    expect(result).toEqual({
      name: {
        value: 'Alice',
        comments: ['// Comment for name'],
      },
    });

  });

  it('should attach block comment to the next property', () => {

    const text = `
/* Block comment */
"age": 25
`;
    const result = parseJsonc(`{ ${text} }`);
    expect(result).toEqual({
      age: {
        value: 25,
        comments: ['/* Block comment */'],
      },
    });

  });

  it('should handle multiple comments before a property', () => {

    const text = `
// First comment
// Second comment
"value": true
`;
    const result = parseJsonc(`{ ${text} }`);
    expect(result).toEqual({
      value: {
        value: true,
        comments: ['// First comment', '// Second comment'],
      },
    });

  });

  it('should not attach comments to array items incorrectly', () => {

    const text = `{
// Comment for array
"list": [1, 2, 3]
}`;
    const result = parseJsonc(text);

    expect(result).toEqual({
      list: {
        value: [
          { value: 1 },
          { value: 2 },
          { value: 3 },
        ],
        comments: ['// Comment for array'],
      },
    });

  });

  it('should parse complex structure with comments and nested types', () => {

    const text = `
// User config
{
  // Name of the user
  "name": "Bob",
  "profile": {
    "age": 35,
    /* Active status */
    "active": true
  },
  "hobbies": [
    "reading",
    // Favorite hobby
    "gaming"
  ]
}
`;
    const result = parseJsonc(text);
    expect(result).toEqual({
      name: {
        value: 'Bob',
        comments: ['// Name of the user'],
      },
      profile: {
        value: {
          age: { value: 35 },
          active: {
            value: true,
            comments: ['/* Active status */'],
          },
        },
      },
      hobbies: {
        value: [
          { value: 'reading' },
          { value: 'gaming', comments: ['// Favorite hobby'] },
        ],
      },
    });

  });

  it('should handle empty array', () => {

    const result = parseJsonc('{"empty": []}');
    expect(result).toEqual({
      empty: {
        value: [],
      },
    });

  });

  it('should handle empty object in array', () => {

    const result = parseJsonc('{"items": [{}]}');

    expect(result).toEqual({
      items: {
        value: [
          { value: {} },
        ],
      },
    });

  });

  it('should throw on invalid JSON', () => {

    expect(() => parseJsonc('{ invalid }')).toThrow();

  });

  it('should throw when root is not an object', () => {

    expect(() => parseJsonc('[1, 2, 3]')).toThrow('Root must be object');

  });

});

describe('deepMerge - JsoncNode structure handling', () => {

  it('should preserve comments when merging JsoncNode structures', () => {

    const targetText = `{
  // Existing comment
  "name": "old-name",
  // Version comment
  "version": "1.0.0"
}`;

    const sourceText = `{
  "name": "new-name"
}`;

    const targetObject = parseJsonc(targetText);
    const sourceObject = parseJsonc(sourceText);

    const mergedObject = deepMerge(
      targetObject,
      sourceObject
    ) as JsoncContainer;

    // Check if name value was updated
    expect(mergedObject.name.value).toBe('new-name');

    // Check if comment is preserved
    expect(mergedObject.name.comments).toEqual(['// Existing comment']);

    // Check if untouched field keeps its comment
    expect(mergedObject.version.comments).toEqual(['// Version comment']);
    expect(mergedObject.version.value).toBe('1.0.0');

  });

  it('should preserve comments in nested objects', () => {

    const targetText = `{
  // Config section
  "config": {
    // Port comment
    "port": 3000,
    // Host comment
    "host": "localhost"
  }
}`;

    const sourceText = `{
  "config": {
    "port": 8080
  }
}`;

    const targetObject = parseJsonc(targetText);
    const sourceObject = parseJsonc(sourceText);

    const mergedObject = deepMerge(
      targetObject,
      sourceObject
    ) as JsoncContainer;

    // Check top-level comment
    expect(mergedObject.config.comments).toEqual(['// Config section']);

    // Check nested structure
    const configValue = mergedObject.config.value as JsoncContainer;
    expect(configValue.port.value).toBe(8080);
    expect(configValue.port.comments).toEqual(['// Port comment']);

    expect(configValue.host.value).toBe('localhost');
    expect(configValue.host.comments).toEqual(['// Host comment']);

  });

  it('should handle adding new fields without losing existing comments', () => {

    const targetText = `{
  // Name comment
  "name": "test"
}`;

    const sourceText = `{
  "description": "new field"
}`;

    const targetObject = parseJsonc(targetText);
    const sourceObject = parseJsonc(sourceText);

    const mergedObject = deepMerge(
      targetObject,
      sourceObject
    ) as JsoncContainer;

    // Existing field should keep its comment
    expect(mergedObject.name.comments).toEqual(['// Name comment']);
    expect(mergedObject.name.value).toBe('test');

    // New field should be added
    expect(mergedObject.description.value).toBe('new field');

  });

  it('should handle trailing commas in objects', () => {

    const result = parseJsonc('{"name": "John", "age": 30,}');

    expect(result).toEqual({
      name: { value: 'John' },
      age: { value: 30 },
    });

  });

  it('should handle trailing commas in arrays', () => {

    const result = parseJsonc('{"list": [1, 2, 3,]}');

    expect(result).toEqual({
      list: {
        value: [
          { value: 1 },
          { value: 2 },
          { value: 3 },
        ],
      },
    });

  });

  it('should provide clear error message for invalid JSON', () => {

    expect(() => parseJsonc('{ invalid }')).toThrow(/Expected|position/);

  });

  it('should provide clear error message when root is not an object', () => {

    expect(() => parseJsonc('[1, 2, 3]')).toThrow('Root must be object');

  });

});
