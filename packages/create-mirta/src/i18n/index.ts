import type { LocaleShape } from './locale-shape.gen';
import { initLocalizationAsync } from '@mirta/i18n';

import { resolve } from 'node:path';

export const { t, getLocale, setLocaleAsync }
  = await initLocalizationAsync<LocaleShape>({
    cwd: resolve(import.meta.dirname, '../'),
  });
