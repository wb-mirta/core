import { createTranslator } from '#src/translator'
import { getLang } from '#src/locale'
import type { Locale, GenericShape, LocalizationContext } from '#src/types'

const mockCreateContext = <TShape extends GenericShape>(
  messages: TShape['messages'],
  fallbackMessages: TShape['messages'] = {},
  locale: Locale = 'en-US' as Locale
): LocalizationContext<TShape> => {

  const fallbackLocale = 'en-US' as Locale

  return {
    strict: false,
    cwd: '/test',
    fallbackAsset: {
      locale: fallbackLocale,
      lang: getLang(fallbackLocale),
      messages: fallbackMessages,
    },
    supportedLocales: new Set([locale, fallbackLocale]),
    locale,
    lang: getLang(locale),
    messages,
  }

}

describe('createTranslator', () => {

  it('should return message by key', () => {

    const context = mockCreateContext({ 'greeting': 'Hello!' })
    const t = createTranslator(context)
    expect(t('greeting')).toBe('Hello!')

  })

  it('should interpolate variables', () => {

    const context = mockCreateContext({ 'greeting': 'Hello, {name}!' })
    const t = createTranslator(context)
    expect(t('greeting', { name: 'Alice' })).toBe('Hello, Alice!')

  })

  it('should handle missing key', () => {

    const context = mockCreateContext({}, { 'title': 'Default' })
    const t = createTranslator(context)
    expect(t('title')).toBe('Default')
    expect(t('unknown')).toBe('{{unknown}}')

  })

  it('should handle adjacent variables without spaces', () => {

    const context = mockCreateContext({
      'greeting': 'Hello {firstName}{lastName}!',
    })
    const t = createTranslator(context)
    expect(t('greeting', { firstName: 'John', lastName: 'Doe' }))
      .toBe('Hello JohnDoe!')

  })

  it('should handle adjacent variables with spaces in between', () => {

    const context = mockCreateContext({
      'status': 'User: {name} Role: {role} Status: {status}',
    })
    const t = createTranslator(context)
    expect(t('status', { name: 'admin', role: 'moderator', status: 'active' }))
      .toBe('User: admin Role: moderator Status: active')

  })

  it('should interpolate variables inside plural forms', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{One file for {owner}} other{# files for {owner}}}',
    })
    const t = createTranslator(context)
    expect(t('files', { count: 1, owner: 'Alice' })).toBe('One file for Alice')
    expect(t('files', { count: 5, owner: 'Bob' })).toBe('5 files for Bob')

  })

  it('should handle variable with spaces in key', () => {

    const context = mockCreateContext({
      'greeting': 'Hello, {first name}!',
    })
    const t = createTranslator(context)
    expect(t('greeting', { 'first name': 'Bob' })).toBe('Hello, Bob!')

  })

  it('should handle missing variable as placeholder', () => {

    const context = mockCreateContext({ 'greeting': 'Hello, {name}!' })
    const t = createTranslator(context)
    expect(t('greeting')).toBe('Hello, {name}!')

  })

  it('should replace variables inside plural forms', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{# file} other{# {noun}s}}',
    })
    const t = createTranslator(context)
    expect(t('files', { count: 1, noun: 'file' })).toBe('1 file')
    expect(t('files', { count: 5, noun: 'file' })).toBe('5 files')

  })

  it('should handle compound variable names with dots and dashes', () => {

    const context = mockCreateContext({
      'greeting': 'Hello, {user.name}! You have {file-count, plural, one{# file} other{# files}}',
    })
    const t = createTranslator(context)
    expect(t('greeting', { 'user.name': 'Alice', 'file-count': 3 }))
      .toBe('Hello, Alice! You have 3 files')

  })

  it('should leave unknown variables as placeholders', () => {

    const context = mockCreateContext({
      'status': 'User: {username}, Role: {role}',
    })
    const t = createTranslator(context)
    expect(t('status', { username: 'admin' })).toBe('User: admin, Role: {role}')

  })

  it('should not replace variable with spaces in key', () => {

    const context = mockCreateContext({
      'msg': 'Hello {first name}!',
    })
    const t = createTranslator(context)
    expect(t('msg', { 'first name': 'Bob' })).toBe('Hello Bob!')

  })

  it('should handle plural: one and other', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{One file} other{# files}}',
    })
    const t = createTranslator(context)

    expect(t('files', { count: 1 })).toBe('One file')
    expect(t('files', { count: 5 })).toBe('5 files')

  })

  it('should handle exact values: =0, =1', () => {

    const context = mockCreateContext({
      'errors': '{count, plural, =0{No errors} =1{One error} other{# errors}}',
    })
    const t = createTranslator(context)
    expect(t('errors', { count: 0 })).toBe('No errors')
    expect(t('errors', { count: 1 })).toBe('One error')
    expect(t('errors', { count: 3 })).toBe('3 errors')

  })

  it('should apply offset correctly', () => {

    const context = mockCreateContext({
      'sockets': '{count, plural, offset:1 =0{Only server} one{One more socket} other{# more sockets}}',
    })
    const t = createTranslator(context)
    expect(t('sockets', { count: 1 })).toBe('Only server')
    expect(t('sockets', { count: 2 })).toBe('One more socket')
    expect(t('sockets', { count: 6 })).toBe('5 more sockets')

  })

  it('should replace # with original value (after offset)', () => {

    const context = mockCreateContext({
      'items': '{count, plural, offset:1 =0{Empty} other{Added # items}}',
    })
    const t = createTranslator(context)
    expect(t('items', { count: 1 })).toBe('Empty')
    expect(t('items', { count: 4 })).toBe('Added 3 items')

  })

  it('should not replace variable inside exact value form', () => {

    const context = mockCreateContext({
      'result': '{count, plural, =0{empty} other{has # items}}',
    })
    const t = createTranslator(context)
    expect(t('result', { count: 0, empty: 'true' })).toBe('empty')
    expect(t('result', { count: 5 })).toBe('has 5 items')

  })

  it('should handle NaN in plural as "NaN"', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{# file} other{# files}}',
    })
    const t = createTranslator(context)
    expect(t('files', { count: NaN })).toBe('NaN')
    expect(t('files', { count: undefined })).toBe('NaN')
    expect(t('files', { count: 'abc' as unknown as number })).toBe('NaN')

  })

  it('should coerce null and arrays to numbers in plural', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{# file} other{# files}}',
    })
    const t = createTranslator(context)
    expect(t('files', { count: null })).toBe('0 files')
    expect(t('files', { count: [] as unknown as number })).toBe('0 files')
    expect(t('files', { count: ['2'] as unknown as number })).toBe('2 files')

  })

  it('should handle negative numbers in plural correctly', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{# file} other{# files}}',
    })
    const t = createTranslator(context)
    expect(t('files', { count: -1 })).toBe('-1 files')
    expect(t('files', { count: -5 })).toBe('-5 files')

  })

  it('should handle fractional numbers in plural correctly', () => {

    const context = mockCreateContext({
      'files': '{count, plural, one{# file} other{# files}}',
    })
    const t = createTranslator(context)
    expect(t('files', { count: 1.0 })).toBe('1 file')
    expect(t('files', { count: 1.5 })).toBe('1.5 files')
    expect(t('files', { count: 2.7 })).toBe('2.7 files')

  })

  it('should handle russian plural forms correctly', () => {

    const context = mockCreateContext(
      { 'files': '{count, plural, one{# файл} few{# файла} many{# файлов}}' },
      {},
      'ru-RU' as Locale
    )

    const t = createTranslator(context)

    expect(t('files', { count: -1 })).toBe('-1 файл')
    expect(t('files', { count: -2 })).toBe('-2 файла')
    expect(t('files', { count: -5 })).toBe('-5 файлов')
    expect(t('files', { count: -11 })).toBe('-11 файлов')
    expect(t('files', { count: -21 })).toBe('-21 файл')

    expect(t('files', { count: 1 })).toBe('1 файл')
    expect(t('files', { count: 2 })).toBe('2 файла')
    expect(t('files', { count: 5 })).toBe('5 файлов')
    expect(t('files', { count: 11 })).toBe('11 файлов')
    expect(t('files', { count: 21 })).toBe('21 файл')

  })

  it('should map "two" form to "few" for ru language', () => {

    const context = mockCreateContext(
      { 'files': '{count, plural, two{# файла} other{# файлов}}' },
      {},
      'ru-RU' as Locale
    )

    const t = createTranslator(context)

    expect(t('files', { count: 2 })).toBe('2 файла')
    expect(t('files', { count: 3 })).toBe('3 файла')
    expect(t('files', { count: 5 })).toBe('5 файлов')

  })

  it('should handle fractional numbers in ru as few', () => {

    const context = mockCreateContext(
      {
        'files': '{count, plural, one{# градус} few{# градуса} many{# градусов}}',
      },
      {},
      'ru-RU' as Locale
    )
    const t = createTranslator(context)

    expect(t('files', { count: 0.5 })).toBe('0.5 градуса')
    expect(t('files', { count: 1.0 })).toBe('1 градус')
    expect(t('files', { count: 1.1 })).toBe('1.1 градуса')
    expect(t('files', { count: 1.5 })).toBe('1.5 градуса')
    expect(t('files', { count: 2.0 })).toBe('2 градуса')
    expect(t('files', { count: 2.7 })).toBe('2.7 градуса')
    expect(t('files', { count: 5.0 })).toBe('5 градусов')
    expect(t('files', { count: 5.5 })).toBe('5.5 градуса')
    expect(t('files', { count: 21.3 })).toBe('21.3 градуса')
    expect(t('files', { count: -1.5 })).toBe('-1.5 градуса')

  })

  it('should return empty string if no forms match and no other', () => {

    const context = mockCreateContext({
      'empty': '{count, plural}',
    })
    const t = createTranslator(context)
    expect(t('empty', { count: 1 })).toBe('')

  })

  it('should use fallback asset when key is missing', () => {

    const context = mockCreateContext(
      {},
      { 'fallbackKey': 'Fallback Value' }
    )

    const t = createTranslator(context)
    expect(t('fallbackKey')).toBe('Fallback Value')

  })

  it('should return {{key}} when neither messages nor fallbackAsset have the key', () => {

    const context = mockCreateContext({}, {})

    const t = createTranslator(context)
    expect(t('unknown')).toBe('{{unknown}}')

  })

  it('should return empty string if plural has no forms', () => {

    const context = mockCreateContext({
      'empty': '{count, plural}',
    })
    const t = createTranslator(context)
    expect(t('empty', { count: 1 })).toBe('')
    expect(t('empty', { count: 5 })).toBe('')

  })

})
