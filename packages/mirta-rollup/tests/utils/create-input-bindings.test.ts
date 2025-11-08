import { createInputBindings } from '#configs/package'
import { NpmBuildError } from '#utils/errors'

describe('createInputBindings', () => {

  describe('successful binding creation', () => {

    it('should map single TypeScript input to output and dts paths', () => {

      const inputs = ['src/index.ts']
      const normalizedExports = {
        './dist/index.mjs': {
          dtsOutputFile: './dist/index.d.mts',
        },
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(result).toEqual({
        'src/index.ts': {
          outputFile: 'index.mjs',
          dtsSourceFile: 'dist/dts/index.d.ts',
          dtsOutputFile: './dist/index.d.mts',
        },
      })

    })

    it('should handle JavaScript input without dtsOutputFile', () => {

      const inputs = ['src/script.js']
      const normalizedExports = {
        './dist/script.mjs': {},
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(result['src/script.js']).toEqual({
        outputFile: 'script.mjs',
        dtsSourceFile: 'dist/dts/script.d.ts',
        dtsOutputFile: undefined,
      })

    })

    it('should map multiple inputs to their respective exports', () => {

      const inputs = ['src/index.ts', 'src/utils.ts', 'src/config.ts']
      const normalizedExports = {
        './dist/index.mjs': { dtsOutputFile: './dist/index.d.mts' },
        './dist/utils.mjs': { dtsOutputFile: './dist/utils.d.mts' },
        './dist/config.mjs': { dtsOutputFile: './dist/config.d.mts' },
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(Object.keys(result)).toHaveLength(3)
      expect(result['src/index.ts']?.outputFile).toBe('index.mjs')
      expect(result['src/utils.ts']?.outputFile).toBe('utils.mjs')
      expect(result['src/config.ts']?.outputFile).toBe('config.mjs')

    })

    it('should handle nested directory structures', () => {

      const inputs = ['src/lib/core/index.ts']
      const normalizedExports = {
        './dist/lib/core/index.mjs': {
          dtsOutputFile: './dist/lib/core/index.d.mts',
        },
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(result['src/lib/core/index.ts']).toEqual({
        outputFile: 'lib/core/index.mjs',
        dtsSourceFile: 'dist/dts/lib/core/index.d.ts',
        dtsOutputFile: './dist/lib/core/index.d.mts',
      })

    })

    it('should handle mixed TypeScript and JavaScript inputs', () => {

      const inputs = ['src/typed.ts', 'src/plain.js']
      const normalizedExports = {
        './dist/typed.mjs': { dtsOutputFile: './dist/typed.d.mts' },
        './dist/plain.mjs': {},
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(result['src/typed.ts']?.dtsOutputFile).toBe('./dist/typed.d.mts')
      expect(result['src/plain.js']?.dtsOutputFile).toBeUndefined()

    })

  })

  describe('skipExports mode', () => {

    it('should skip export validation when skipExports is true', () => {

      const inputs = ['src/index.ts']
      const normalizedExports = {}

      const result = createInputBindings(inputs, normalizedExports, true)

      expect(result['src/index.ts']).toEqual({
        outputFile: 'index.mjs',
        dtsSourceFile: 'dist/dts/index.d.ts',
        dtsOutputFile: undefined,
      })

    })

    it('should still process inputs correctly when skipExports is enabled', () => {

      const inputs = ['src/main.ts', 'src/helper.ts']
      const normalizedExports = {}

      const result = createInputBindings(inputs, normalizedExports, true)

      expect(Object.keys(result)).toHaveLength(2)
      expect(result['src/main.ts']).toBeDefined()
      expect(result['src/helper.ts']).toBeDefined()

    })

  })

  describe('error: input path outside src/', () => {

    it('should throw inputPathRequiresPrefix for input outside src/', () => {

      const inputs = ['lib/index.ts']
      const normalizedExports = {
        './dist/index.mjs': {},
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputPathRequiresPrefix', 'lib/index.ts', 'src/'))

    })

    it('should throw for root-level input file', () => {

      const inputs = ['index.ts']
      const normalizedExports = {}

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputPathRequiresPrefix', 'index.ts', 'src/'))

    })

  })

  describe('error: unsupported file extension', () => {

    it('should throw for input without .ts or .js extension', () => {

      const inputs = ['src/data.json']
      const normalizedExports = {}

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputFileExtensionNotSupported', 'src/data.json'))

    })

    it('should throw for input with .mjs extension', () => {

      const inputs = ['src/index.mjs']
      const normalizedExports = {}

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputFileExtensionNotSupported', 'src/index.mjs'))

    })

  })

  describe('error: input has no matching export', () => {

    it('should throw inputHasNoExport when input has no corresponding export', () => {

      const inputs = ['src/orphan.ts']
      const normalizedExports = {
        './dist/index.mjs': {},
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputHasNoExport', 'src/orphan.ts', './dist/orphan.mjs'))

    })

    it('should throw for multiple unmatched inputs', () => {

      const inputs = ['src/index.ts', 'src/missing.ts']
      const normalizedExports = {
        './dist/index.mjs': {},
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputHasNoExport', 'src/missing.ts', './dist/missing.mjs'))

    })

  })

  describe('error: export has no matching input', () => {

    it('should throw exportHasNoInput when export has no corresponding input', () => {

      const inputs = ['src/index.ts']
      const normalizedExports = {
        './dist/index.mjs': {},
        './dist/utils.mjs': {},
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('exportHasNoInput', './dist/utils.mjs'))

    })

    it('should throw for nested export without input', () => {

      const inputs = ['src/index.ts']
      const normalizedExports = {
        './dist/index.mjs': {},
        './dist/lib/helper.mjs': { dtsOutputFile: './dist/lib/helper.d.mts' },
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('exportHasNoInput', './dist/lib/helper.mjs'))

    })

  })

  describe('error: duplicate output files', () => {

    it('should throw inputGeneratesDuplicateOutput for duplicate outputFile', () => {

      const inputs = ['src/index.ts', 'src/index.js']
      const normalizedExports = {
        './dist/index.mjs': {},
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputGeneratesDuplicateOutput', 'index.mjs'))

    })

    it('should detect duplicates in nested paths', () => {

      const inputs = ['src/utils/index.ts', 'src/utils/index.js']
      const normalizedExports = {
        './dist/utils/index.mjs': {},
      }

      expect(() => createInputBindings(inputs, normalizedExports, false))
        .toThrow(NpmBuildError.get('inputGeneratesDuplicateOutput', 'utils/index.mjs'))

    })

  })

  describe('edge cases', () => {

    it('should handle deeply nested input paths', () => {

      const inputs = ['src/a/b/c/d/module.ts']
      const normalizedExports = {
        './dist/a/b/c/d/module.mjs': { dtsOutputFile: './dist/a/b/c/d/module.d.mts' },
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(result['src/a/b/c/d/module.ts']).toEqual({
        outputFile: 'a/b/c/d/module.mjs',
        dtsSourceFile: 'dist/dts/a/b/c/d/module.d.ts',
        dtsOutputFile: './dist/a/b/c/d/module.d.mts',
      })

    })

    it('should handle exports without dtsOutputFile field', () => {

      const inputs = ['src/plain.ts']
      const normalizedExports = {
        './dist/plain.mjs': {},
      }

      const result = createInputBindings(inputs, normalizedExports, false)

      expect(result['src/plain.ts']?.dtsOutputFile).toBeUndefined()

    })

    it('should allow export validation bypass with skipExports for bin packages', () => {

      const inputs = ['src/cli.ts', 'src/server.ts']
      const normalizedExports = {}

      expect(() => createInputBindings(inputs, normalizedExports, true)).not.toThrow()

    })

  })

})
