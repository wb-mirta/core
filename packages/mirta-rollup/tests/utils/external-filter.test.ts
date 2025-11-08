import { createExternalFilter } from '#utils/external-filter'

describe('createExternalFilter', () => {

  const originalDev = globalThis.__DEV__

  beforeEach(() => {

    vi.clearAllMocks()
    globalThis.__DEV__ = false

  })

  afterEach(() => {

    globalThis.__DEV__ = originalDev

  })

  describe('custom functions', () => {

    it('should use predicate function and return true', () => {

      const customFn = vi.fn(() => true)
      const filter = createExternalFilter('/project', customFn)

      const result = filter('some-module', undefined, false)

      expect(result).toBe(true)
      expect(customFn).toHaveBeenCalledWith('some-module', undefined, false)

    })

    it('should use predicate function and return false', () => {

      const customFn = vi.fn(() => false)
      const filter = createExternalFilter('/project', customFn)

      const result = filter('some-module', undefined, false)

      expect(result).toBe(false)
      expect(customFn).toHaveBeenCalledWith('some-module', undefined, false)

    })

    it('should stop at the first function returning true', () => {

      const fn1 = vi.fn(() => true)
      const fn2 = vi.fn(() => false)
      const filter = createExternalFilter('/project', fn1, fn2)

      const result = filter('module', undefined, false)

      expect(result).toBe(true)
      expect(fn1).toHaveBeenCalled()
      expect(fn2).not.toHaveBeenCalled()

    })

    it('should check all functions if previous returned false', () => {

      const fn1 = vi.fn(() => false)
      const fn2 = vi.fn(() => true)
      const filter = createExternalFilter('/project', fn1, fn2)

      const result = filter('module', undefined, false)

      expect(result).toBe(true)
      expect(fn1).toHaveBeenCalled()
      expect(fn2).toHaveBeenCalled()

    })

  })

  describe('pattern arrays', () => {

    it('should handle string matching', () => {

      const filter = createExternalFilter('/project', ['lodash', 'react'])

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('react', undefined, false)).toBe(true)
      expect(filter('vue', undefined, false)).toBe(false)

    })

    it('should handle RegExp patterns', () => {

      const filter = createExternalFilter('/project', [/^@scope\//])

      expect(filter('@scope/package', undefined, false)).toBe(true)
      expect(filter('@scope/another', undefined, false)).toBe(true)
      expect(filter('regular-package', undefined, false)).toBe(false)

    })

    it('should handle mixed patterns (strings and RegExp)', () => {

      const filter = createExternalFilter('/project', ['lodash', /^react/])

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('react', undefined, false)).toBe(true)
      expect(filter('react-dom', undefined, false)).toBe(true)
      expect(filter('vue', undefined, false)).toBe(false)

    })

    it('should handle single string instead of array', () => {

      const filter = createExternalFilter('/project', 'lodash')

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('other', undefined, false)).toBe(false)

    })

    it('should handle single RegExp instead of array', () => {

      const filter = createExternalFilter('/project', /^node:/)

      expect(filter('node:path', undefined, false)).toBe(true)
      expect(filter('node:fs', undefined, false)).toBe(true)
      expect(filter('fs-extra', undefined, false)).toBe(false)

    })

  })

  describe('path resolution relative to cwd', () => {

    it('should consider module outside cwd as external (relative path starts with ..)', () => {

      const filter = createExternalFilter('/project/packages/app')
      const absolutePath = '/project/packages/other/file.ts'

      const result = filter(absolutePath, undefined, true)

      expect(result).toBe(true)

    })

    it('should consider module inside cwd as internal', () => {

      const filter = createExternalFilter('/project/packages/app')
      const absolutePath = '/project/packages/app/src/utils.ts'

      const result = filter(absolutePath, undefined, true)

      expect(result).toBe(false)

    })

    it('should not check paths for unresolved modules', () => {

      const filter = createExternalFilter('/project')
      const absolutePath = '/somewhere/else/file.ts'

      const result = filter(absolutePath, undefined, false)

      expect(result).toBe(false)

    })

    it('should handle relative paths (not absolute)', () => {

      const filter = createExternalFilter('/project')
      const relativePath = './src/utils'

      const result = filter(relativePath, undefined, true)

      expect(result).toBe(false)

    })

    it('should not log in production mode', () => {

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {

        // Bypass console.debug in tests
      })

      globalThis.__DEV__ = false

      const filter = createExternalFilter('/project/packages/app')
      const absolutePath = '/project/other/file.ts'

      filter(absolutePath, undefined, true)

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()

    })

  })

  describe('combined scenarios', () => {

    it('should handle multiple externals in priority order', () => {

      const customFn = vi.fn((target: string) => target === 'custom-module')
      const filter = createExternalFilter(
        '/project',
        customFn,
        ['lodash'],
        [/^react/]
      )

      expect(filter('custom-module', undefined, false)).toBe(true)
      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('react-dom', undefined, false)).toBe(true)
      expect(filter('vue', undefined, false)).toBe(false)

    })

    it('should return false if no criteria match', () => {

      const filter = createExternalFilter(
        '/project',
        ['lodash'],
        [/^@scope\//]
      )

      const result = filter('some-random-module', undefined, false)

      expect(result).toBe(false)

    })

    it('should use all three strategies: function, patterns, cwd', () => {

      const customFn = vi.fn(() => false)
      const filter = createExternalFilter(
        '/project/src',
        customFn,
        ['lodash']
      )

      // Функция вернёт false
      expect(filter('custom', undefined, false)).toBe(false)

      // Паттерн сработает
      expect(filter('lodash', undefined, false)).toBe(true)

      // Путь вне cwd
      expect(filter('/other/project/file.ts', undefined, true)).toBe(true)

    })

  })

  describe('edge cases', () => {

    it('should handle empty externals list', () => {

      const filter = createExternalFilter('/project')

      expect(filter('any-module', undefined, false)).toBe(false)

    })

    it('should handle empty cwd', () => {

      const filter = createExternalFilter('', ['lodash'])

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('/absolute/path', undefined, true)).toBe(false)

    })

    it('should correctly handle importer parameter', () => {

      const customFn = vi.fn((_target, importer) => importer === '/src/index.ts')
      const filter = createExternalFilter('/project', customFn)

      expect(filter('module', '/src/index.ts', false)).toBe(true)
      expect(filter('module', '/src/other.ts', false)).toBe(false)

    })

    it('should handle absolute path in relativePath', () => {

      const filter = createExternalFilter('/project')
      const absolutePathOutside = '/completely/different/path.ts'

      const result = filter(absolutePathOutside, undefined, true)

      expect(result).toBe(true)

    })

  })

})
