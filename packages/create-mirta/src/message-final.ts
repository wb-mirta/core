import { getLocale } from '#i18n'
import chalk from 'chalk'

const finalMessageEn = `\
${chalk.green('Welcome to your new wb-rules project!')} 🎉
Open it in VSCode or your favourite editor and start building.

📚 Documentation:
https://dzen.ru/wihome

⭐ Love this framework? Give it a star on GitHub:
https://github.com/wb-mirta/core

💬 Join the Mirta Guild community on Boosty:
https://boosty.to/wihome

Thank you for using Mirta!
`
const finalMessageRu = `\
${chalk.green('Добро пожаловать в ваш новый проект wb-rules!')} 🎉
Откройте его в VSCode или другом редакторе и начинайте разработку.

📚 Документация:
https://dzen.ru/wihome

⭐ Нравится фреймворк? Поставьте ему звёздочку на GitHub:
https://github.com/wb-mirta/core

💬 Присоединяйтесь к сообществу Mirta Guild на Boosty:
https://boosty.to/wihome

Спасибо, что выбрали Мирту!
`

export function getFinalMessage() {

  const locale = getLocale()

  return locale === 'ru-RU'
    ? finalMessageRu
    : finalMessageEn

}
