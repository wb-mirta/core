import type { LocaleShape } from './locale-shape.gen'
import { initLocalizationAsync } from '@mirta/i18n'

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const { t, getLocale, setLocaleAsync }
  = await initLocalizationAsync<LocaleShape>({
    cwd: resolve(__dirname, '../'),
  })
