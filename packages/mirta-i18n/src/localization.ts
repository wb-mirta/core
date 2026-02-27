import { LocalizationError } from '#src/errors';
import { getSystemLocale, setLocaleAsync, resolveLocale, loadAssetAsync, resolveSupportedLocalesAsync } from './locale';
import { createTranslator } from './translator';
import type { Localization, LocalizationContext, GenericShape } from './types';

import { DEFAULT_FALLBACK_LOCALE } from './constants';
import { join } from 'node:path';

/**
 * Опции для инициализации системы локализации.
 *
 * @since 0.4.0
 *
 **/
export interface LocalizationOptions {
  /**
   * Рабочая директория, в которой ожидается папка `locales/`.
   *
   * По умолчанию `process.cwd()`
   *
   **/
  cwd?: string;

  /**
   * Локаль по умолчанию, если системная недоступна или не поддерживается.
   *
   * По умолчанию `'en-US'`
   *
   **/
  fallbackLocale?: string;

  /**
   * Определяет реакцию на ошибки при локализации.
   *
   * - `true` — выбрасывает ошибки,
   * - `false` — использует fallback-поведение.
   *
   * По умолчанию `false`.
   *
   **/
  strict?: boolean;
}

/**
 * Инициализирует систему локализации, загружает сообщения для системной и fallback-локали.
 *
 * @template TShape - Интерфейс локали, описывающий структуру сообщений и переменных.
 *                    Если не указан, применяется тип {@link GenericShape}, разрешающий использовать любые строки как ключи.
 *                    Для включения строгой типизации передайте сгенерированный или явно определённый интерфейс `LocaleShape`.
 *
 * @param options - Опции инициализации локализации.
 * @param options.cwd - Рабочая директория, откуда загружаются локали (по умолчанию: `process.cwd()`).
 * @param options.fallbackLocale - Локаль по умолчанию, если другие не найдены (по умолчанию: `'en-US'`).
 *
 * @returns Промис, разрешающийся в объект `Localization<TShape>`, содержащий:
 * - `getLocale()` — текущую локаль
 * - `setLocaleAsync(locale)` — переключение локали
 * - `t(key, vars)` — функция перевода
 *
 * @throws Ошибка, если не удалось загрузить fallback-локаль.
 *
 * @example
 * ```ts
 * // Без LocaleShape — нет строгой проверки ключей
 * const { t } = await initLocalizationAsync()
 * t('non.existing.key') // OK (нет ошибки на уровне типов)
 * ```
 *
 * @example
 * ```ts
 * // С интерфейсом — полная типизация
 * const { t } = await initLocalizationAsync<MyLocaleShape>()
 * t('non.existing.key') // Ошибка компиляции
 * ```
 *
 * @since 0.4.0
 *
 **/
export async function initLocalizationAsync<
  TShape extends GenericShape = GenericShape
>(options: LocalizationOptions = {}): Promise<Localization<TShape>> {

  const cwd = options.cwd ?? process.cwd();

  const fallbackLocale = resolveLocale(
    options.fallbackLocale,
    DEFAULT_FALLBACK_LOCALE
  );

  const fallbackAsset = await loadAssetAsync<TShape>(
    fallbackLocale,
    cwd
  );

  if (!fallbackAsset)
    throw LocalizationError.get('fallback.loadFailed', fallbackLocale);

  const systemLocale = resolveLocale(getSystemLocale(), fallbackLocale);

  const effectiveAsset = await loadAssetAsync<TShape>(
    systemLocale,
    cwd
  ) ?? fallbackAsset;

  const localesDir = join(cwd, 'locales');
  const supportedLocales = await resolveSupportedLocalesAsync(localesDir);

  const context: LocalizationContext<TShape> = {

    strict: options.strict ?? false,

    cwd,
    fallbackAsset,
    supportedLocales,

    lang: effectiveAsset.lang,
    locale: effectiveAsset.locale,
    messages: effectiveAsset.messages,

  };

  return {

    getLocale: () => context.locale,

    setLocaleAsync: async (locale: string): Promise<void> => {

      await setLocaleAsync(locale, context);

    },

    t: createTranslator(context),

  };

}
