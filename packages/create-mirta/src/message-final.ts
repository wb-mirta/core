import { getLocale } from '#i18n'
import chalk from 'chalk'

const finalMessageEn = `\
${chalk.green('Welcome to your new wb-rules project!')} 🎉
Open it in VSCode or your favourite editor and start building.

📚 Documentation:
https://dzen.ru/wihome

💡 Mirta is powered entirely by community support.
To keep the project alive and growing, your help is essential.

💖 A recurring subscription on Boosty is the best way to support:
https://boosty.to/wihome

☕ One-time tips are also appreciated:
https://pay.cloudtips.ru/p/58512cca

⭐ Your star on GitHub helps others discover Mirta:
https://github.com/wb-mirta/core

Thank you for using Mirta!
`
const finalMessageRu = `\
${chalk.green('Добро пожаловать в ваш новый проект wb-rules!')} 🎉
Откройте его в VSCode или другом редакторе и начинайте разработку.

📚 Документация:
https://dzen.ru/wihome

Мирта развивается только за счёт добровольных взносов.
Чтобы проект жил и рос — нужна ваша поддержка.

💖 Регулярная подписка на Boosty — лучший способ помочь:
https://boosty.to/wihome

☕ Также можно поддержать разовым платежом:
https://pay.cloudtips.ru/p/58512cca

⭐ Нравится фреймворк? Поставьте ему звёздочку на GitHub:
https://github.com/wb-mirta/core

Спасибо, что выбрали Мирту!
`

export function getFinalMessage() {

  const locale = getLocale()

  return locale === 'ru-RU'
    ? finalMessageRu
    : finalMessageEn

}
