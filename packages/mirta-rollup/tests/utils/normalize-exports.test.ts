import { normalizeExports } from '#configs/package'
import { NpmBuildError } from '#utils/errors'
import type { PackageExports } from '@mirta/package'

describe('normalizeExports', () => {

  describe('string export inputs', () => {

    it('should normalize simple string export', () => {

      const exports = './dist/index.mjs'

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/index.mjs': {},
      })

    })

    it('should use string path as key', () => {

      const exports = './dist/lib/utils.mjs'

      const result = normalizeExports(exports)

      expect(result).toHaveProperty('./dist/lib/utils.mjs')
      expect(result['./dist/lib/utils.mjs']).toEqual({})

    })

  })

  describe('conditional exports with import', () => {

    it('should extract entry path from simple conditional export', () => {

      const exports = {
        import: './dist/index.mjs',
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/index.mjs': {},
      })

    })

    it('should extract entry and types from import condition object', () => {

      const exports = {
        import: {
          types: './dist/index.d.mts',
          default: './dist/index.mjs',
        },
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/index.mjs': {
          dtsOutputFile: './dist/index.d.mts',
        },
      })

    })

    it('should handle import condition with only default', () => {

      const exports = {
        import: {
          default: './dist/main.mjs',
        },
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/main.mjs': {},
      })

    })

    it('should throw exportTypesOnly when only types are defined in import', () => {

      const exports = {
        import: {
          types: './dist/index.d.mts',
        },
      }

      expect(() => normalizeExports(exports))
        .toThrow(NpmBuildError.get('exportTypesOnly', './dist/index.d.mts'))

    })

  })

  describe('multiple export entries', () => {

    it('should normalize object with multiple export paths', () => {

      const exports = {
        '.': './dist/index.mjs',
        './utils': './dist/utils.mjs',
        './config': {
          import: './dist/config.mjs',
        },
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/index.mjs': {},
        './dist/utils.mjs': {},
        './dist/config.mjs': {},
      })

    })

    it('should handle mixed format exports with types', () => {

      const exports = {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
        './lib': './dist/lib.mjs',
        './utils': {
          import: './dist/utils.mjs',
        },
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/index.mjs': {
          dtsOutputFile: './dist/index.d.mts',
        },
        './dist/lib.mjs': {},
        './dist/utils.mjs': {},
      })

    })

    it('should skip null or undefined values', () => {

      const exports = {
        '.': './dist/index.mjs',
        './internal': null,
        './private': undefined,
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/index.mjs': {},
      })
      expect(result).not.toHaveProperty('./internal')
      expect(result).not.toHaveProperty('./private')

    })

  })

  describe('error: empty exports', () => {

    it('should throw exportEmpty when exports is null', () => {

      expect(() => normalizeExports(null as PackageExports))
        .toThrow(NpmBuildError.get('exportEmpty'))

    })

    it('should throw exportEmpty when exports is undefined', () => {

      expect(() => normalizeExports(undefined as PackageExports))
        .toThrow(NpmBuildError.get('exportEmpty'))

    })

  })

  describe('error: array exports not allowed', () => {

    it('should throw exportDisallowArrayType for array export', () => {

      const exports = ['./dist/a.js', './dist/b.js'] as unknown as PackageExports

      expect(() => normalizeExports(exports))
        .toThrow(NpmBuildError.get('exportDisallowArrayType'))

    })

    it('should verify error code', () => {

      try {

        normalizeExports([] as unknown as PackageExports)
        expect.fail('Should have thrown')

      }
      catch (error) {

        expect(error).toBeInstanceOf(NpmBuildError)
        expect((error as NpmBuildError).code).toBe('exportDisallowArrayType')

      }

    })

  })

  describe('error: export key must start with dot', () => {

    it('should throw exportMustStartWithDot for invalid key', () => {

      const exports = {
        'utils': './dist/utils.mjs',
      }

      expect(() => normalizeExports(exports))
        .toThrow(NpmBuildError.get('exportMustStartWithDot', 'utils'))

    })

    it('should throw for multiple invalid keys', () => {

      const exports = {
        '.': './dist/index.mjs',
        'invalid': './dist/invalid.mjs',
      }

      expect(() => normalizeExports(exports))
        .toThrow(NpmBuildError.get('exportMustStartWithDot', 'invalid'))

    })

    it('should allow keys starting with ./', () => {

      const exports = {
        './utils': './dist/utils.mjs',
        './config': './dist/config.mjs',
      }

      expect(() => normalizeExports(exports)).not.toThrow()

    })

    it('should allow single dot key', () => {

      const exports = {
        '.': './dist/index.mjs',
      }

      expect(() => normalizeExports(exports)).not.toThrow()

    })

  })

  describe('error: types defined without entry', () => {

    it('should throw exportTypesOnly when only types in nested export', () => {

      const exports = {
        './utils': {
          types: './dist/utils.d.ts',
        },
      }

      expect(() => normalizeExports(exports))
        .toThrow(NpmBuildError.get('exportTypesOnly', './dist/utils.d.ts'))

    })

    it('should throw for conditional import with only types', () => {

      const exports = {
        '.': {
          import: {
            types: './dist/index.d.mts',
          },
        },
      }

      expect(() => normalizeExports(exports))
        .toThrow(NpmBuildError.get('exportTypesOnly', './dist/index.d.mts'))

    })

  })

  describe('edge cases', () => {

    it('should handle complex nested structure', () => {

      const exports = {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
        './package.json': './package.json',
      }

      const result = normalizeExports(exports)

      expect(result['./dist/index.mjs']).toBeDefined()
      expect(result['./package.json']).toBeDefined()

    })

    it('should handle deeply nested paths', () => {

      const exports = {
        './lib/utils/helper': './dist/lib/utils/helper.mjs',
      }

      const result = normalizeExports(exports)

      expect(result).toEqual({
        './dist/lib/utils/helper.mjs': {},
      })

    })

    it('should handle export paths with multiple segments', () => {

      const exports = {
        '.': './dist/index.mjs',
        './a/b/c': './dist/a/b/c.mjs',
      }

      const result = normalizeExports(exports)

      expect(result).toHaveProperty('./dist/index.mjs')
      expect(result).toHaveProperty('./dist/a/b/c.mjs')

    })

  })

})
