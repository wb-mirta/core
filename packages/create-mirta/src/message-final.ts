import { getLocale } from './utils/localization'

const locale = getLocale()

const finalMessageEn = `\
To get started, open your project in VSCode or other code editor.
Documentation can be found at: https://dzen.ru/wihome

Please, give a star on GitHub if you appreciate this work:
https://github.com/wb-mirta/core
`
const finalMessageRu = `\
Откройте проект в VSCode или другом подходящем редакторе.
Документация публикуется на Дзене: https://dzen.ru/wihome

Если вам нравится фреймворк, поставьте ему звёздочку на Гитхабе:
https://github.com/wb-mirta/core

Поблагодарить разработчика можно через Boosty:
https://boosty.to/wihome/donate

Также доступен сервис для безналичных чаевых от Т‑Банка и CloudPayments:
https://pay.cloudtips.ru/p/58512cca
`

export const finalMessage = locale === 'ru-RU'
  ? finalMessageRu
  : finalMessageEn
