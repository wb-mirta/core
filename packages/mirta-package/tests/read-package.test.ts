import { PackageError } from '#src/errors/package-error'

// Mock fs module
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}))

// Import after mocking
const fs = await import('node:fs')
const mockReadFileSync = vi.mocked(fs.readFileSync)

// Mock resolvePackagePath to isolate readPackage
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

  describe('successful read operations', () => {

    it('should resolve, read and parse package.json from directory path', () => {

      const inputPath = 'packages/core'

      mockResolvePackagePath.mockReturnValue(resolvedPath)
      mockReadFileSync.mockReturnValue(mockPackageJson)

      const result = readPackage(inputPath)

      expect(mockResolvePackagePath).toHaveBeenCalledWith(inputPath)
      expect(mockReadFileSync).toHaveBeenCalledWith(resolvedPath, 'utf-8')
      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
        exports: { '.': './dist/index.mjs' },
      })

    })

    it('should handle path ending with package.json directly', () => {

      const inputPath = 'packages/core/package.json'

      mockResolvePackagePath.mockReturnValue(resolvedPath)
      mockReadFileSync.mockReturnValue(mockPackageJson)

      const result = readPackage(inputPath)

      expect(mockResolvePackagePath).toHaveBeenCalledWith(inputPath)
      expect(mockReadFileSync).toHaveBeenCalledWith(resolvedPath, 'utf-8')
      expect(result.name).toBe('test-package')

    })

    it('should handle minimal package.json with only name field', () => {

      const minimalJson = '{"name":"minimal-pkg"}'

      mockResolvePackagePath.mockReturnValue(resolvedPath)
      mockReadFileSync.mockReturnValue(minimalJson)

      const result = readPackage('.')

      expect(result).toEqual({ name: 'minimal-pkg' })

    })

  })

  describe('path resolution errors', () => {

    it('should propagate invalidPath error from resolvePackagePath', () => {

      const invalidPath = 'src/index.ts'
      const error = PackageError.get('invalidPath', invalidPath)

      mockResolvePackagePath.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage(invalidPath)).toThrow(error)

    })

  })

  describe('file system errors', () => {

    beforeEach(() => {

      mockResolvePackagePath.mockReturnValue(resolvedPath)

    })

    it('should throw notFound error when file does not exist (ENOENT)', () => {

      const error = Object.assign(new Error('ENOENT: no such file'), {
        code: 'ENOENT',
      })

      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('notFound', resolvedPath))

    })

    it('should throw accessDenied error on permission denied (EACCES)', () => {

      const error = Object.assign(new Error('EACCES: permission denied'), {
        code: 'EACCES',
      })

      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('accessDenied', resolvedPath))

    })

    it('should throw accessDenied error on operation not permitted (EPERM)', () => {

      const error = Object.assign(new Error('EPERM: operation not permitted'), {
        code: 'EPERM',
      })

      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('accessDenied', resolvedPath))

    })

    it('should throw failedToRead on unknown fs error with message', () => {

      const error = new Error('Unknown I/O error occurred')

      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('failedToRead', resolvedPath, 'Unknown I/O error occurred'))

    })

    it('should throw failedToRead when error has no message', () => {

      const error = new Error()

      mockReadFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('failedToRead', resolvedPath, ''))

    })

  })

  describe('JSON parsing errors', () => {

    beforeEach(() => {

      mockResolvePackagePath.mockReturnValue(resolvedPath)

    })

    it('should throw invalidJson on JSON SyntaxError', () => {

      mockReadFileSync.mockReturnValue('{ invalid json }')

      expect(() => readPackage('packages/core')).toThrow(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect.objectContaining({
          code: 'invalidJson',
        })
      )

    })

    it('should include syntax error message in thrown error', () => {

      mockReadFileSync.mockReturnValue('{"name": invalid}')

      try {

        readPackage('packages/core')
        expect.fail('Should have thrown an error')

      }
      catch (error) {

        expect(error).toBeInstanceOf(PackageError)
        expect((error as PackageError).code).toBe('invalidJson')

      }

    })

  })

  describe('unexpected error types', () => {

    beforeEach(() => {

      mockResolvePackagePath.mockReturnValue(resolvedPath)

    })

    it('should handle non-Error throw (string)', () => {

      mockReadFileSync.mockImplementation(() => {

        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'String error: file read failed'

      })

      expect(() => readPackage('packages/core'))
        .toThrow(PackageError.get('failedToRead', resolvedPath, 'String error: file read failed'))

    })

    it('should handle non-Error throw (object)', () => {

      mockReadFileSync.mockImplementation(() => {

        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw { message: 'Custom error object' }

      })

      expect(() => readPackage('packages/core')).toThrow(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect.objectContaining({
          code: 'failedToRead',
        })
      )

    })

  })

})
