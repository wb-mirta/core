const fs = await import('fs')
const readFileSync = vi.mocked(fs.readFileSync)

import { FileError } from '#utils/errors'

// Мокаем fs модуль
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

// Импортируем после мокирования
const { parsePackageJson } = await import('#utils/package')

describe('parsePackageJson', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  describe('successful reading and parsing', () => {

    it('should correctly parse a valid package.json', () => {

      const mockPackageJson = {
        name: 'test-package',
        version: '1.0.0',
        exports: {
          '.': './dist/index.js',
        },
      }

      readFileSync.mockReturnValue(JSON.stringify(mockPackageJson))

      const result = parsePackageJson('/path/to/package.json')

      expect(readFileSync).toHaveBeenCalledWith('/path/to/package.json', 'utf-8')
      expect(result).toEqual(mockPackageJson)

    })

    it('should parse a minimal package.json', () => {

      const mockPackageJson = {
        name: 'minimal-package',
      }

      readFileSync.mockReturnValue(JSON.stringify(mockPackageJson))

      const result = parsePackageJson('./package.json')

      expect(result).toEqual(mockPackageJson)

    })

  })

  describe('file system error handling', () => {

    it('should throw FileError when file does not exist (ENOENT)', () => {

      const error = Object.assign(
        new Error('ENOENT: no such file or directory'),
        { code: 'ENOENT' }
      )

      readFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => parsePackageJson('/nonexistent/package.json'))
        .toThrow(FileError.get('notFound', '/nonexistent/package.json'))

    })

    it('should throw FileError when access denied (EACCES)', () => {

      const error = Object.assign(
        new Error('EACCES: permission denied'),
        { code: 'EACCES' }
      )

      readFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => parsePackageJson('/restricted/package.json'))
        .toThrow(FileError.get('noAccess', '/restricted/package.json'))

    })

    it('should throw FileError when operation not permitted (EPERM)', () => {

      const error = Object.assign(
        new Error('EPERM: operation not permitted'),
        { code: 'EPERM' }
      )

      readFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => parsePackageJson('/restricted/package.json'))
        .toThrow(FileError.get('noAccess', '/restricted/package.json'))

    })

  })

  describe('JSON parsing error handling', () => {

    it('should throw FileError for invalid JSON (SyntaxError)', () => {

      readFileSync.mockReturnValue('{ invalid json }')

      expect(() => parsePackageJson('/path/to/package.json'))
        .toThrow(
          FileError.get(
            'invalidJson',
            '/path/to/package.json',
            'Expected property name or \'}\' in JSON at position 2 (line 1 column 3)'
          )
        )

    })

    it('should throw FileError for empty file', () => {

      readFileSync.mockReturnValue('')

      expect(() => parsePackageJson('/path/to/package.json'))
        .toThrow(FileError.get('invalidJson', '/path/to/package.json', 'Unexpected end of JSON input'))

    })

  })

  describe('other error handling', () => {

    it('should throw FileError for unknown error with message', () => {

      const error = new Error('Unknown filesystem error')

      readFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => parsePackageJson('/path/to/package.json'))
        .toThrow(
          FileError.get(
            'failedToParse',
            '/path/to/package.json',
            'Unknown filesystem error'
          )
        )

    })

    it('should throw FileError for non-Error type error', () => {

      readFileSync.mockImplementation(() => {

        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'String error'

      })

      expect(() => parsePackageJson('/path/to/package.json'))
        .toThrow(FileError.get('failedToParse', '/path/to/package.json', 'String error'))

    })

    it('should handle unhandled error codes', () => {

      const error = Object.assign(
        new Error('EIO: i/o error'),
        { code: 'EIO' }
      )

      readFileSync.mockImplementation(() => {

        throw error

      })

      expect(() => parsePackageJson('/path/to/package.json'))
        .toThrow(FileError.get('failedToParse', '/path/to/package.json', 'EIO: i/o error'))

    })

  })

})
