import { basename, join } from 'node:path'
import { loadMessagesAsync } from './messages'
import type { Locale, Lang, LocalizationContext, GenericShape, LocaleAsset } from './types'
import { glob } from 'node:fs/promises'
import { SourceError } from './errors'

/**
 * Сканирует директорию `localesDir` и возвращает множество доступных локалей.
 * Игнорирует отсутствие директории или файлов. Проверяет валидность локалей через `resolveLocale`.
 *
 * @param localesDir - Путь к папке с локалями (обычно `./locales`)
 * @returns Множество валидных локалей (например, `Set { 'en-US', 'ru-RU' }`)
 *
 * @since 0.4.0
 *
 **/
export async function resolveSupportedLocalesAsync(
  localesDir: string
): Promise<Set<Locale>> {

  const pattern = join(localesDir, '*.json')

  const locales = new Set<Locale>()

  try {

    for await (const filePath of glob(pattern)) {

      const localeSource = basename(filePath, '.json')

      const locale = resolveLocale(localeSource)

      if (!locale)
        continue

      if (locale !== localeSource)
        throw SourceError.get('file.nonCanonicalName', filePath, locale)

      locales.add(locale)

    }

  }
  catch (e: unknown) {

    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT')
      return locales

    throw e

  }

  return locales

}

/**
 * Извлекает языковой код из локали (например, 'ru' из 'ru-RU').
 *
 * @param locale - Локаль в формате xx-XX
 * @returns Языковой код (xx)
 *
 * @since 0.4.0
 *
 **/
export function getLang(locale: Locale): Lang {

  return locale.split('-')[0] as Lang

}

/**
 * Загружает ассет локали: сообщения, язык и локаль.
 * Возвращает `undefined`, если сообщения не найдены.
 * Результат замораживается для неизменяемости.
 *
 * @template TShape - Интерфейс локали
 *
 * @param locale - Локаль (например, `'en-US'`)
 * @param cwd - Рабочая директория
 *
 * @returns Ассет локали или `undefined`
 *
 * @since 0.4.0
 *
 **/
export async function loadAssetAsync<TShape extends GenericShape>(

  locale: Locale,
  cwd: string

): Promise<LocaleAsset<TShape> | undefined> {

  const messages = await loadMessagesAsync<TShape>(locale, cwd)

  if (!messages)
    return

  return Object.freeze({
    locale,
    lang: getLang(locale),
    messages,
  })

}

/**
 * Определяет поддерживаемую локаль на основе входного значения.
 * Если локаль не поддерживается или некорректна, возвращается fallback.
 *
 * @param input - Входная локаль (например, 'ru', 'ru-RU', 'en-US')
 * @param defaultLocale - Локаль по умолчанию, если входная не распознана
 * @returns Нормализованная и поддерживаемая локаль
 *
 * @since 0.4.0
 *
 **/
export function resolveLocale(input: string | undefined, defaultLocale: Locale): Locale

export function resolveLocale(input: string | undefined, defaultLocale?: Locale): Locale | undefined

export function resolveLocale(input: string | undefined, defaultLocale?: Locale): Locale | undefined {

  if (!input || typeof input !== 'string')
    return defaultLocale

  // Специальный случай в Unix-подобных системах (POSIX)
  if (input === 'C')
    return defaultLocale

  // Приведение к нижнему регистру для сравнения.
  const normalizedInput = input
    .trim()
    .toLowerCase()

  if (normalizedInput === 'en' || normalizedInput.startsWith('en-'))
    return 'en-US' as Locale

  if (normalizedInput === 'ru' || normalizedInput.startsWith('ru-'))
    return 'ru-RU' as Locale

  try {

    // Защитная попытка нормализовать через Intl.
    return Intl.getCanonicalLocales(input.trim())[0] as Locale

  }
  catch {

    return defaultLocale

  }

}

/**
 * Асинхронно устанавливает локаль в контексте.
 * Если сообщения для локали недоступны, используется fallback.
 *
 * @param locale - Целевая локаль
 * @param context - Контекст локализации
 *
 * @since 0.4.0
 *
 **/
export async function setLocaleAsync<TShape extends GenericShape>(
  locale: string,
  context: LocalizationContext<TShape>
): Promise<void> {

  const fallbackAsset = context.fallbackAsset

  const targetLocale = resolveLocale(locale, fallbackAsset.locale)

  // TODO: Добавить debug-логирование при переходе к fallbackAsset.

  // Защищает от попыток загрузки и кэширования несуществующих ассетов.
  const effectiveAsset = context.supportedLocales.has(targetLocale)
    ? await loadAssetAsync<TShape>(targetLocale, context.cwd) ?? fallbackAsset
    : fallbackAsset

  context.locale = effectiveAsset.locale
  context.lang = effectiveAsset.lang
  context.messages = effectiveAsset.messages

}

/**
 * Получает системную локаль из переменных окружения или Intl.
 *
 * @returns Локаль в формате xx-XX (например, 'ru-RU')
 *
 * @since 0.4.0
 *
 **/
export function getSystemLocale(): string {

  const rawLocale
    = process.env.LC_ALL
      || process.env.LC_MESSAGES
      || process.env.LANG
      || Intl.DateTimeFormat().resolvedOptions().locale

  return rawLocale.split('.')[0].replaceAll('_', '-')

}
