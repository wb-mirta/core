import { parseLocaleJson, readLocaleFileAsync, loadMessagesAsync, __resetInternalState } from '#src/messages'
import { SourceError } from '#src/errors/source'
import { readFile } from 'node:fs/promises'
import type { Locale } from '#src/types'

vi.mock('node:fs/promises')

describe('message utilities', () => {

  const errors = {
    'ENOENT': 'Not found',
    'EACCES': 'Permission denied',
    'EPERM': 'Operation not permitted',
  } as const

  function error(code: keyof typeof errors): Error {

    const error = {
      name: 'Error',
      message: errors[code],
      code,
    } as NodeJS.ErrnoException

    return error

  }

  describe('parseLocaleJson()', () => {

    it('should parse valid JSON object', () => {

      const result = parseLocaleJson('{"key": "value"}')

      expect(result).toEqual({ key: 'value' })

    })

    it('should throw on JSON array', () => {

      expect(() => parseLocaleJson('["item1", "item2"]'))
        .toThrow(SourceError.get('parse.invalidJsonRoot'))

      try {

        parseLocaleJson('[]')

      }
      catch (e) {

        expect(e).toBeInstanceOf(SourceError)
        if (e instanceof SourceError) {

          expect(e.code).toBe('parse.invalidJsonRoot')

        }

      }

    })

    it('should throw on JSON string', () => {

      expect(() => parseLocaleJson('"string value"'))
        .toThrow(SourceError.get('parse.invalidJsonRoot'))

    })

    it('should throw on JSON number', () => {

      expect(() => parseLocaleJson('42'))
        .toThrow(SourceError.get('parse.invalidJsonRoot'))

    })

    it('should throw on JSON null', () => {

      expect(() => parseLocaleJson('null'))
        .toThrow(SourceError.get('parse.invalidJsonRoot'))

    })

    it('should parse nested objects', () => {

      const result = parseLocaleJson('{"nested": {"key": "value"}}')

      expect(result).toEqual({ nested: { key: 'value' } })

    })

    it('should throw on invalid JSON syntax', () => {

      expect(() => parseLocaleJson('{invalid}'))
        .toThrow(SyntaxError)

    })

  })

  describe('readLocaleFileAsync()', () => {

    beforeEach(() => {

      vi.clearAllMocks()

    })

    it('should read and parse valid locale file', async () => {

      vi.mocked(readFile).mockResolvedValue('{"greeting": "Hello"}')

      const result = await readLocaleFileAsync('/path/en-US.json')

      expect(result).toEqual({ greeting: 'Hello' })
      expect(Object.isFrozen(result)).toBe(true)

    })

    it('should throw file.notFound for ENOENT', async () => {

      vi.mocked(readFile).mockRejectedValue(error('ENOENT'))

      await expect(readLocaleFileAsync('/missing.json'))
        .rejects.toThrow(SourceError.get('file.notFound', '/missing.json'))

      try {

        await readLocaleFileAsync('/missing.json')

      }
      catch (e) {

        expect(e).toBeInstanceOf(SourceError)
        if (e instanceof SourceError) {

          expect(e.code).toBe('file.notFound')

        }

      }

    })

    it('should throw file.accessDenied for EACCES', async () => {

      vi.mocked(readFile).mockRejectedValue(error('EACCES'))

      await expect(readLocaleFileAsync('/restricted.json'))
        .rejects.toThrow(SourceError.get('file.accessDenied', '/restricted.json'))

      try {

        await readLocaleFileAsync('/restricted.json')

      }
      catch (e) {

        if (e instanceof SourceError) {

          expect(e.code).toBe('file.accessDenied')

        }

      }

    })

    it('should throw file.accessDenied for EPERM', async () => {

      vi.mocked(readFile).mockRejectedValue(error('EPERM'))

      await expect(readLocaleFileAsync('/protected.json'))
        .rejects.toThrow(SourceError.get('file.accessDenied', '/protected.json'))

    })

    it('should throw parse.invalidJson for malformed JSON', async () => {

      vi.mocked(readFile).mockResolvedValue('{invalid json}')

      try {

        await readLocaleFileAsync('/bad.json')

      }
      catch (e) {

        expect(e).toBeInstanceOf(SourceError)

        if (!(e instanceof SourceError))
          return

        expect(e.code).toBe('parse.invalidJson')
        expect(e.message).toContain('bad.json')

      }

    })

    it('should throw parse.invalidJsonRoot for JSON array', async () => {

      vi.mocked(readFile).mockResolvedValue('["item"]')

      await expect(readLocaleFileAsync('/array.json'))
        .rejects.toThrow(SourceError.get('parse.invalidJsonRoot'))

    })

    it('should rethrow SourceError as-is', async () => {

      const sourceError = SourceError.get('parse.invalidJsonRoot')

      vi.mocked(readFile).mockRejectedValue(sourceError)

      await expect(readLocaleFileAsync('/test.json'))
        .rejects.toThrow(sourceError)

    })

    it('should throw file.failedToRead for unknown errors', async () => {

      vi.mocked(readFile).mockRejectedValue(new Error('Unknown Error'))

      await expect(readLocaleFileAsync('/unknown.json'))
        .rejects.toThrow(SourceError.get('file.failedToRead', '/unknown.json', 'Unknown Error'))

      try {

        await readLocaleFileAsync('/unknown.json')

      }
      catch (e) {

        if (e instanceof SourceError) {

          expect(e.code).toBe('file.failedToRead')
          expect(e.message).toContain('Unknown Error')

        }

      }

    })

  })

  describe('loadMessagesAsync()', () => {

    beforeEach(() => {

      vi.clearAllMocks()
      // Clear the internal cache by reloading the module
      vi.resetModules()

      __resetInternalState()

    })

    it('should load messages from file', async () => {

      vi.mocked(readFile).mockResolvedValue('{"key": "value"}')

      const messages = await loadMessagesAsync('en-US' as Locale, '/test')

      expect(messages).toEqual({ key: 'value' })

    })

    it('should cache loaded messages', async () => {

      vi.mocked(readFile).mockResolvedValue('{"cached": "data"}')

      await loadMessagesAsync('en-US' as Locale, '/test')
      await loadMessagesAsync('en-US' as Locale, '/test')

      // Should only read once due to caching
      expect(readFile).toHaveBeenCalledTimes(1)

    })

    it('should return null for missing file', async () => {

      const error = {
        name: 'Error',
        message: 'Not found',
        code: 'ENOENT',
      } as NodeJS.ErrnoException

      vi.mocked(readFile).mockRejectedValue(error)

      const messages = await loadMessagesAsync('fr-FR' as Locale, '/test')

      expect(messages).toBeNull()

    })

    it('should cache null for missing file', async () => {

      vi.mocked(readFile).mockRejectedValue(error('ENOENT'))

      await loadMessagesAsync('de-DE' as Locale, '/test')
      await loadMessagesAsync('de-DE' as Locale, '/test')

      // Should only attempt read once, then use cached null
      expect(readFile).toHaveBeenCalledTimes(1)

    })

    it('should throw for access denied errors', async () => {

      vi.mocked(readFile).mockRejectedValue(error('EACCES'))

      try {

        await loadMessagesAsync('ru-RU' as Locale, '/test')

        expect.fail('Expected error to be thrown')

      }
      catch (e: unknown) {

        expect(e).toBeInstanceOf(SourceError)

        if (!(e instanceof SourceError))
          return

        expect(e.code).toBe('file.accessDenied')
        expect(e.message).toContain('ru-RU.json')

      }

    })

    it('should throw for parse errors', async () => {

      vi.mocked(readFile).mockResolvedValue('[array]')

      try {

        await loadMessagesAsync('en-US' as Locale, '/test')
        expect.fail('Expected error to be thrown')

      }
      catch (e: unknown) {

        expect(e).toBeInstanceOf(SourceError)

        if (!(e instanceof SourceError))
          return

        expect(e.code).toBe('parse.invalidJson')

      }

    })

  })

})
