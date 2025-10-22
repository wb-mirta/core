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

  describe('пользовательские функции', () => {

    it('должна использовать функцию-предикат и возвращать true', () => {

      const customFn = vi.fn(() => true)
      const filter = createExternalFilter('/project', customFn)

      const result = filter('some-module', undefined, false)

      expect(result).toBe(true)
      expect(customFn).toHaveBeenCalledWith('some-module', undefined, false)

    })

    it('должна использовать функцию-предикат и возвращать false', () => {

      const customFn = vi.fn(() => false)
      const filter = createExternalFilter('/project', customFn)

      const result = filter('some-module', undefined, false)

      expect(result).toBe(false)
      expect(customFn).toHaveBeenCalledWith('some-module', undefined, false)

    })

    it('должна останавливаться на первой функции, вернувшей true', () => {

      const fn1 = vi.fn(() => true)
      const fn2 = vi.fn(() => false)
      const filter = createExternalFilter('/project', fn1, fn2)

      const result = filter('module', undefined, false)

      expect(result).toBe(true)
      expect(fn1).toHaveBeenCalled()
      expect(fn2).not.toHaveBeenCalled()

    })

    it('должна проверять все функции, если предыдущие вернули false', () => {

      const fn1 = vi.fn(() => false)
      const fn2 = vi.fn(() => true)
      const filter = createExternalFilter('/project', fn1, fn2)

      const result = filter('module', undefined, false)

      expect(result).toBe(true)
      expect(fn1).toHaveBeenCalled()
      expect(fn2).toHaveBeenCalled()

    })

  })

  describe('массивы паттернов', () => {

    it('должна обрабатывать строковое совпадение', () => {

      const filter = createExternalFilter('/project', ['lodash', 'react'])

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('react', undefined, false)).toBe(true)
      expect(filter('vue', undefined, false)).toBe(false)

    })

    it('должна обрабатывать RegExp паттерны', () => {

      const filter = createExternalFilter('/project', [/^@scope\//])

      expect(filter('@scope/package', undefined, false)).toBe(true)
      expect(filter('@scope/another', undefined, false)).toBe(true)
      expect(filter('regular-package', undefined, false)).toBe(false)

    })

    it('должна обрабатывать смешанные паттерны (строки и RegExp)', () => {

      const filter = createExternalFilter('/project', ['lodash', /^react/])

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('react', undefined, false)).toBe(true)
      expect(filter('react-dom', undefined, false)).toBe(true)
      expect(filter('vue', undefined, false)).toBe(false)

    })

    it('должна обрабатывать одиночную строку вместо массива', () => {

      const filter = createExternalFilter('/project', 'lodash')

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('other', undefined, false)).toBe(false)

    })

    it('должна обрабатывать одиночный RegExp вместо массива', () => {

      const filter = createExternalFilter('/project', /^node:/)

      expect(filter('node:path', undefined, false)).toBe(true)
      expect(filter('node:fs', undefined, false)).toBe(true)
      expect(filter('fs-extra', undefined, false)).toBe(false)

    })

  })

  describe('проверка путей относительно cwd', () => {

    it('должна считать внешним модуль вне cwd (относительный путь начинается с ..)', () => {

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {

        // Bypass console.debug in tests

      })

      globalThis.__DEV__ = true

      const filter = createExternalFilter('/project/packages/app')
      const absolutePath = '/project/packages/other/file.ts'

      const result = filter(absolutePath, undefined, true)

      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping non-project'))

      consoleSpy.mockRestore()

    })

    it('должна считать внутренним модуль внутри cwd', () => {

      const filter = createExternalFilter('/project/packages/app')
      const absolutePath = '/project/packages/app/src/utils.ts'

      const result = filter(absolutePath, undefined, true)

      expect(result).toBe(false)

    })

    it('не должна проверять пути для не разрешённых модулей', () => {

      const filter = createExternalFilter('/project')
      const absolutePath = '/somewhere/else/file.ts'

      const result = filter(absolutePath, undefined, false)

      expect(result).toBe(false)

    })

    it('должна обрабатывать относительные пути (не абсолютные)', () => {

      const filter = createExternalFilter('/project')
      const relativePath = './src/utils'

      const result = filter(relativePath, undefined, true)

      expect(result).toBe(false)

    })

    it('не должна логировать в продакшн режиме', () => {

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

  describe('комбинированные сценарии', () => {

    it('должна обрабатывать несколько externals в порядке приоритета', () => {

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

    it('должна возвращать false, если ни один критерий не совпал', () => {

      const filter = createExternalFilter(
        '/project',
        ['lodash'],
        [/^@scope\//]
      )

      const result = filter('some-random-module', undefined, false)

      expect(result).toBe(false)

    })

    it('должна использовать все три стратегии: функция, паттерны, cwd', () => {

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

    it('должна обрабатывать пустой список externals', () => {

      const filter = createExternalFilter('/project')

      expect(filter('any-module', undefined, false)).toBe(false)

    })

    it('должна обрабатывать пустой cwd', () => {

      const filter = createExternalFilter('', ['lodash'])

      expect(filter('lodash', undefined, false)).toBe(true)
      expect(filter('/absolute/path', undefined, true)).toBe(false)

    })

    it('должна корректно обрабатывать importer параметр', () => {

      const customFn = vi.fn((_target, importer) => importer === '/src/index.ts')
      const filter = createExternalFilter('/project', customFn)

      expect(filter('module', '/src/index.ts', false)).toBe(true)
      expect(filter('module', '/src/other.ts', false)).toBe(false)

    })

    it('должна обрабатывать абсолютный путь в relativePath', () => {

      const filter = createExternalFilter('/project')
      const absolutePathOutside = '/completely/different/path.ts'

      const result = filter(absolutePathOutside, undefined, true)

      expect(result).toBe(true)

    })

  })

})
