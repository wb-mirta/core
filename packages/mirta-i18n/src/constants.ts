import type { Locale } from './types';

/**
 * Имя текущего пакета в формате, используемом в npm-реестре.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export const THIS_PACKAGE_NAME = '@mirta/i18n';

/**
 * Локаль по умолчанию (fallback), если параметр `options.fallbackLocale` не указан.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export const DEFAULT_FALLBACK_LOCALE = 'en-US' as Locale;
