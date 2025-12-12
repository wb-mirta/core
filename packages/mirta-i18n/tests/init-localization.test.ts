import { initLocalizationAsync, type Lang, type Locale } from '#src'
import { LocalizationError } from '#src/errors/localization'

// Мокаем getSystemLocale
vi.mock('#src/locale', async () => {

  const actual = await vi.importActual('#src/locale')
  return {
    ...actual,
    getSystemLocale: vi.fn(),
    loadAssetAsync: vi.fn(),
  }

})

const { getSystemLocale, loadAssetAsync } = await import('#src/locale')

describe('initLocalizationAsync', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  it('should initialize with system locale', async () => {

    // Мокаем системную локаль
    vi.mocked(getSystemLocale).mockReturnValue('ru-RU')

    // Мокаем загрузку ассетов: сначала fallback (en-US), потом системная (ru-RU)
    vi.mocked(loadAssetAsync)
      .mockResolvedValueOnce({
        lang: 'en' as Lang,
        locale: 'en-US' as Locale,
        messages: { title: 'Title' },
      })
      .mockResolvedValueOnce({
        lang: 'ru' as Lang,
        locale: 'ru-RU' as Locale,
        messages: { subtitle: 'Подзаголовок' },
      })

    const { getLocale, t } = await initLocalizationAsync()

    // Проверяем: fallback загружается первым, затем системная
    expect(loadAssetAsync).toHaveBeenNthCalledWith(1, 'en-US', expect.any(String))
    expect(loadAssetAsync).toHaveBeenNthCalledWith(2, 'ru-RU', expect.any(String))

    expect(getLocale()).toBe('ru-RU')

    expect(t('title')).toBe('Title')
    expect(t('subtitle')).toBe('Подзаголовок')

  })

  it('should use fallback if system locale is missing', async () => {

    vi.mocked(getSystemLocale).mockReturnValue('fr-FR')

    vi.mocked(loadAssetAsync)
      .mockResolvedValueOnce({ // en-US (fallback)
        lang: 'en' as Lang,
        locale: 'en-US' as Locale,
        messages: { title: 'fallback text' },
      })
      .mockResolvedValueOnce(undefined) // fr-FR → not found

    const { t } = await initLocalizationAsync({ fallbackLocale: 'en-US' })

    expect(t('title')).toBe('fallback text')

  })

  it('should throw if fallback locale cannot be loaded', async () => {

    vi.mocked(getSystemLocale).mockReturnValue('de-DE')

    vi.mocked(loadAssetAsync).mockResolvedValueOnce(undefined) // en-US тоже не загрузить

    await expect(
      initLocalizationAsync({ fallbackLocale: 'en-US' })
    ).rejects.toThrow(LocalizationError.get('fallback.loadFailed', 'en-US'))

  })

})
