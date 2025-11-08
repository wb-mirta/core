import { parsePackageJson } from '#src/parse-package-json'

describe('parsePackageJson', () => {

  describe('valid JSON', () => {

    it('should parse a valid package.json object', () => {

      const json = `{
        "name": "test-package",
        "version": "1.0.0",
        "exports": {
          ".": "./dist/index.js"
        }
      }`

      const result = parsePackageJson(json)

      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
        exports: {
          '.': './dist/index.js',
        },
      })

    })

    it('should parse minimal package.json', () => {

      const json = `{"name": "minimal"}`

      const result = parsePackageJson(json)

      expect(result).toEqual({ name: 'minimal' })

    })

  })

  describe('invalid JSON', () => {

    it('should throw SyntaxError for malformed JSON', () => {

      const invalidJson = '{ name: invalid }'

      expect(() => parsePackageJson(invalidJson))
        .toThrow(SyntaxError)

    })

    it('should throw SyntaxError for empty string', () => {

      expect(() => parsePackageJson(''))
        .toThrow(SyntaxError)

    })

    it('should throw SyntaxError for trailing comma', () => {

      const json = `{
        "name": "trailing",
        "version": "1.0.0",
      }`

      expect(() => parsePackageJson(json))
        .toThrow(SyntaxError)

    })

  })

})
