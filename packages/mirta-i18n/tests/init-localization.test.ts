import { initLocalizationAsync } from '#src'
import { LocalizationError } from '#src/errors/localization'
import { getSystemLocale } from '#src/locale'
import { loadMessagesAsync, __resetInternalState } from '#src/messages'

// Мокаем getSystemLocale
vi.mock('#src/locale', async () => {

  const actual = await vi.importActual('#src/locale')

  return {
    ...actual,
    getSystemLocale: vi.fn(),
  }

})

vi.mock('#src/messages')

describe('initLocalizationAsync', () => {

  beforeEach(() => {

    vi.clearAllMocks()
    __resetInternalState()

  })

  it('should initialize with system locale', async () => {

    vi.mocked(getSystemLocale).mockReturnValue('ru-RU')

    vi.mocked(loadMessagesAsync).mockResolvedValueOnce({ title: 'Title' })
    vi.mocked(loadMessagesAsync).mockResolvedValueOnce({ subtitle: 'Подзаголовок' })

    const { getLocale, t } = await initLocalizationAsync()

    // Проверяем порядок вызова: сначала fallback, затем системная локаль
    expect(loadMessagesAsync).toHaveBeenNthCalledWith(1, 'en-US', expect.any(String))
    expect(loadMessagesAsync).toHaveBeenNthCalledWith(2, 'ru-RU', expect.any(String))

    expect(getLocale()).toBe('ru-RU')

    expect(t('title')).toBe('Title')
    expect(t('subtitle')).toBe('Подзаголовок')

  })

  it('should use fallback if system locale is missing', async () => {

    vi.mocked(getSystemLocale).mockReturnValue('fr-FR')

    vi.mocked(loadMessagesAsync)
      // First call to load fallback messages
      .mockResolvedValueOnce({ title: 'fallback text' })
      // Second call to load system locale messages
      .mockResolvedValueOnce(null)

    const { t } = await initLocalizationAsync({
      fallbackLocale: 'en-US',
    })

    expect(t('title')).toBe('fallback text')

  })

  it('should throw if fallback locale cannot be loaded', async () => {

    vi.mocked(getSystemLocale).mockReturnValue('de-DE')

    vi.mocked(loadMessagesAsync).mockResolvedValueOnce(null)

    await expect(

      initLocalizationAsync({ fallbackLocale: 'en-US' })

    ).rejects.toThrow(LocalizationError.get('fallback.loadFailed', 'en-US'))

  })

})
