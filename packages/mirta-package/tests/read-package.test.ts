import { PackageError } from '#src/errors/package-error'

// Мокаем fs модуль
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

// Импортируем после мокирования
const fs = await import('node:fs')
const mockReadFileSync = vi.mocked(fs.readFileSync)

// Мокаем resolvePackagePath, чтобы изолировать readPackage
vi.mock('#src/resolve-package-path', () => ({
  resolvePackagePath: vi.fn(),
}))

const { resolvePackagePath } = await import('#src/resolve-package-path')
const mockResolvePackagePath = vi.mocked(resolvePackagePath)

const { readPackage } = await import('#src/read-package')

describe('readPackage', () => {

  const mockPackageJson = `{
    "name": "test-package",
    "version": "1.0.0",
    "exports": { ".": "./dist/index.mjs" }
  }`

  const resolvedPath = 'packages/core/package.json'

  beforeEach(() => {

    vi.clearAllMocks()

  })

  describe('successful read and parse', () => {

    it('should resolve, read and parse package.json from directory', () => {

      const inputPath = 'packages/core'

      mockResolvePackagePath.mockReturnValue(resolvedPath)
      mockReadFileSync.mockReturnValue(mockPackageJson)

      const result = readPackage(inputPath)

      expect(mockResolvePackagePath).toHaveBeenCalledWith(inputPath)
      expect(mockReadFileSync).toHaveBeenCalledWith(resolvedPath, 'utf-8')
      expect(result).toEqual(JSON.parse(mockPackageJson))

    })

    it('should read directly if path ends with package.json', () => {

      const inputPath = 'packages/core/package.json'

      mockResolvePackagePath.mockReturnValue(resolvedPath)
      mockReadFileSync.mockReturnValue(mockPackageJson)

      const result = readPackage(inputPath)

      expect(mockResolvePackagePath).toHaveBeenCalledWith(inputPath)
      expect(mockReadFileSync).toHaveBeenCalledWith(resolvedPath, 'utf-8')
      expect(result.name).toBe('test-package')

    })

  })

  describe('path resolution errors', () => {

    it('should propagate invalidPath error from resolvePackagePath', () => {

      const error = PackageError.get('invalidPath', 'src/index.ts')
      mockResolvePackagePath.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('src/index.ts')).toThrow(error)

    })

  })

  describe('file system errors', () => {

    beforeEach(() => {

      mockResolvePackagePath.mockReturnValue(resolvedPath)

    })

    it('should throw notFound error on ENOENT', () => {

      const error = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' })
      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('notFound', resolvedPath))

    })

    it('should throw accessDenied error on EACCES', () => {

      const error = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' })
      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('accessDenied', resolvedPath))

    })

    it('should throw accessDenied error on EPERM', () => {

      const error = Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' })
      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('accessDenied', resolvedPath))

    })

    it('should throw failedToRead on unknown fs error', () => {

      const error = new Error('Unknown I/O error')
      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('failedToRead', resolvedPath, 'Unknown I/O error'))

    })

  })

  describe('JSON parsing errors', () => {

    beforeEach(() => {

      mockResolvePackagePath.mockReturnValue(resolvedPath)

    })

    it('should throw invalidJson on SyntaxError', () => {

      const syntaxError = new SyntaxError('Unexpected token i in JSON')
      mockReadFileSync.mockImplementation(() => {

        throw syntaxError

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('invalidJson', resolvedPath, syntaxError.message))

    })

  })

  describe('unexpected error types', () => {

    beforeEach(() => {

      mockResolvePackagePath.mockReturnValue(resolvedPath)

    })

    it('should handle non-Error throw', () => {

      mockReadFileSync.mockImplementation(() => {

        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'String error: failed to read file'

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('failedToRead', resolvedPath, 'String error: failed to read file'))

    })

  })

})
