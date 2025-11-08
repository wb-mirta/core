import { resolvePackagePath } from '#src/resolve-package-path'
import { PackageError } from '#src/errors/package-error'

describe('resolvePackagePath', () => {

  describe('valid paths — returns package.json path', () => {

    it('should return path as is if ends with package.json', () => {

      expect(resolvePackagePath('package.json')).toBe('package.json')
      expect(resolvePackagePath('packages/core/package.json')).toBe('packages/core/package.json')

    })

    it('should append package.json to directory path', () => {

      expect(resolvePackagePath('.')).toBe('package.json')
      expect(resolvePackagePath('./')).toBe('package.json')
      expect(resolvePackagePath('.\\')).toBe('package.json')

      expect(resolvePackagePath('packages/core')).toBe('packages/core/package.json')

      expect(resolvePackagePath('..')).toBe('../package.json')
      expect(resolvePackagePath('../../shared')).toBe('../../shared/package.json')

    })

  })

  describe('invalid paths — throws PackageError with code invalidPath', () => {

    it('should throw for file with extension (not package.json)', () => {

      expect(() => resolvePackagePath('src/index.ts'))
        .toThrow(PackageError.get('invalidPath', 'src/index.ts'))

      expect(() => resolvePackagePath('lib/utils.js'))
        .toThrow(PackageError.get('invalidPath', 'lib/utils.js'))

      expect(() => resolvePackagePath('config.json'))
        .toThrow(PackageError.get('invalidPath', 'config.json'))

    })

    it('should throw for file in parent dir', () => {

      expect(() => resolvePackagePath('../app/main.ts'))
        .toThrow(PackageError.get('invalidPath', '../app/main.ts'))

    })

  })

})
