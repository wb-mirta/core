import type { LocaleShape } from './locale-shape.gen'
import { initLocalizationAsync } from '@mirta/i18n'

export const { t, getLocale, setLocaleAsync }
  = await initLocalizationAsync<LocaleShape>()
