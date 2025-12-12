import {
  getLang,
  resolveLocale,
  getSystemLocale,
  loadAssetAsync,
  setLocaleAsync
} from '#src/locale'
import { loadMessagesAsync } from '#src/messages'
import type { Locale, Lang, LocalizationContext, GenericShape } from '#src/types'

vi.mock('#src/messages')

describe('locale utilities', () => {

  describe('getLang()', () => {

    it('should extract language from en-US', () => {

      expect(getLang('en-US' as Locale)).toBe('en')

    })

    it('should extract language from ru-RU', () => {

      expect(getLang('ru-RU' as Locale)).toBe('ru')

    })

  })

  describe('resolveLocale()', () => {

    it('should return default locale when input is undefined', () => {

      const result = resolveLocale(undefined, 'en-US' as Locale)

      expect(result).toBe('en-US')

    })

    it('should return undefined when no default provided and input undefined', () => {

      const result = resolveLocale(undefined)

      expect(result).toBeUndefined()

    })

    it('should handle C locale as fallback', () => {

      const result = resolveLocale('C', 'en-US' as Locale)

      expect(result).toBe('en-US')

    })

    it('should normalize en to en-US', () => {

      const result = resolveLocale('en', 'ru-RU' as Locale)

      expect(result).toBe('en-US')

    })

    it('should normalize EN to en-US', () => {

      const result = resolveLocale('EN')

      expect(result).toBe('en-US')

    })

    it('should normalize en-GB to en-US', () => {

      const result = resolveLocale('en-GB')

      expect(result).toBe('en-US')

    })

    it('should normalize ru to ru-RU', () => {

      const result = resolveLocale('ru')

      expect(result).toBe('ru-RU')

    })

    it('should normalize RU to ru-RU', () => {

      const result = resolveLocale('RU')

      expect(result).toBe('ru-RU')

    })

    it('should trim whitespace', () => {

      const result = resolveLocale('  en-US  ')

      expect(result).toBe('en-US')

    })

    it('should handle empty string', () => {

      const result = resolveLocale('', 'en-US' as Locale)

      expect(result).toBe('en-US')

    })

    it('should return default for invalid locale', () => {

      const result = resolveLocale('invalid@#$', 'en-US' as Locale)

      expect(result).toBe('en-US')

    })

  })

  describe('getSystemLocale()', () => {

    const originalEnv = process.env

    beforeEach(() => {

      process.env = {}

    })

    afterEach(() => {

      process.env = originalEnv

    })

    it('should read from LC_ALL first', () => {

      process.env.LC_ALL = 'ru_RU.UTF-8'
      process.env.LC_MESSAGES = 'en_US.UTF-8'
      process.env.LANG = 'fr_FR.UTF-8'

      const locale = getSystemLocale()

      expect(locale).toBe('ru-RU')

    })

    it('should read from LC_MESSAGES if LC_ALL absent', () => {

      process.env.LC_MESSAGES = 'en_US.UTF-8'
      process.env.LANG = 'fr_FR.UTF-8'

      const locale = getSystemLocale()

      expect(locale).toBe('en-US')

    })

    it('should read from LANG if LC_ALL and LC_MESSAGES absent', () => {

      process.env.LANG = 'de_DE.UTF-8'

      const locale = getSystemLocale()

      expect(locale).toBe('de-DE')

    })

    it('should normalize underscores to dashes', () => {

      process.env.LC_ALL = 'ru_RU'

      const locale = getSystemLocale()

      expect(locale).toBe('ru-RU')

    })

    it('should strip encoding suffix', () => {

      process.env.LC_ALL = 'en_US.UTF-8'

      const locale = getSystemLocale()

      expect(locale).toBe('en-US')

    })

    it('should fallback to Intl when no env vars', () => {

      const locale = getSystemLocale()

      expect(typeof locale).toBe('string')
      expect(locale.length).toBeGreaterThan(0)

    })

  })

  describe('loadAssetAsync()', () => {

    beforeEach(() => {

      vi.clearAllMocks()

    })

    it('should load asset with messages', async () => {

      const messages = { greeting: 'Hello' }

      vi.mocked(loadMessagesAsync).mockResolvedValue(messages)

      const asset = await loadAssetAsync('en-US' as Locale, '/test')

      expect(asset).toBeDefined()
      expect(asset?.locale).toBe('en-US')
      expect(asset?.lang).toBe('en')
      expect(asset?.messages).toEqual(messages)

    })

    it('should return undefined when messages not found', async () => {

      vi.mocked(loadMessagesAsync).mockResolvedValue(null)

      const asset = await loadAssetAsync('fr-FR' as Locale, '/test')

      expect(asset).toBeUndefined()

    })

    it('should freeze the asset', async () => {

      vi.mocked(loadMessagesAsync).mockResolvedValue({ key: 'value' })

      const asset = await loadAssetAsync('ru-RU' as Locale, '/test')

      expect(Object.isFrozen(asset)).toBe(true)

    })

  })

  describe('setLocaleAsync()', () => {

    beforeEach(() => {

      vi.clearAllMocks()

    })

    it('should update context with new locale', async () => {

      const fallbackMessages = { key: 'fallback' }
      const ruMessages = { key: 'ru value' }

      const context: LocalizationContext<GenericShape> = {
        strict: false,
        cwd: '/test',
        fallbackAsset: {
          locale: 'en-US' as Locale,
          lang: 'en' as Lang,
          messages: fallbackMessages,
        },
        supportedLocales: new Set(['en-US' as Locale, 'ru-RU' as Locale]),
        locale: 'en-US' as Locale,
        lang: 'en' as Lang,
        messages: fallbackMessages,
      }

      vi.mocked(loadMessagesAsync).mockResolvedValue(ruMessages)

      await setLocaleAsync('ru-RU', context)

      expect(context.locale).toBe('ru-RU')
      expect(context.lang).toBe('ru')
      expect(context.messages).toEqual(ruMessages)

    })

    it('should fallback when locale not supported', async () => {

      const fallbackMessages = { key: 'fallback' }

      const context: LocalizationContext<GenericShape> = {
        strict: false,
        cwd: '/test',
        fallbackAsset: {
          locale: 'en-US' as Locale,
          lang: 'en' as Lang,
          messages: fallbackMessages,
        },
        supportedLocales: new Set(['en-US' as Locale]),
        locale: 'en-US' as Locale,
        lang: 'en' as Lang,
        messages: fallbackMessages,
      }

      await setLocaleAsync('fr-FR', context)

      expect(context.locale).toBe('en-US')
      expect(context.messages).toEqual(fallbackMessages)

    })

    it('should fallback when loading fails', async () => {

      const fallbackMessages = { key: 'fallback' }

      const context: LocalizationContext<GenericShape> = {
        strict: false,
        cwd: '/test',
        fallbackAsset: {
          locale: 'en-US' as Locale,
          lang: 'en' as Lang,
          messages: fallbackMessages,
        },
        supportedLocales: new Set(['en-US' as Locale, 'de-DE' as Locale]),
        locale: 'en-US' as Locale,
        lang: 'en' as Lang,
        messages: fallbackMessages,
      }

      vi.mocked(loadMessagesAsync).mockResolvedValue(null)

      await setLocaleAsync('de-DE', context)

      expect(context.locale).toBe('en-US')
      expect(context.messages).toEqual(fallbackMessages)

    })

  })

})
