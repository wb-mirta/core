import { LocalizationError } from './errors'
import type { LocalizationContext, GenericShape, PluralForm, VariablesOf, Lang } from './types'

/**
 * Определяет форму множественного числа для заданного языка и числа.
 *
 * Поддерживает:
 * - Русский (`ru`): `one`, `few`, `many`
 * - Английский и прочие: `one` (если 1), иначе `other`
 *
 * @param lang - Языковой код (например, 'ru', 'en')
 * @param count - Число, для которого определяется форма
 *
 * @returns Одна из форм множественного числа (см. {@link PluralForm})
 *
 * @since 0.4.0
 *
 **/
export function getPluralForm(lang: Lang, count: number): PluralForm {

  if (lang === 'ru') {

    // Если дробное — всегда 'few' (родительный падеж ед. числа)
    if (!Number.isInteger(count))
      return 'few'

    const absCount = Math.floor(Math.abs(count))

    const mod10 = absCount % 10
    const mod100 = absCount % 100

    if (mod10 === 1 && mod100 !== 11)
      return 'one'

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
      return 'few'

    return 'many'

  }

  return count === 1 ? 'one' : 'other'

}

/**
 * Создаёт функцию перевода на основе текущего контекста локализации.
 *
 * Поддерживает:
 * - Подстановку переменных: `{name}`
 * - Множественные формы: `{count, plural, one{...} other{...}}`
 * - Смещение (offset): `{count, plural, offset:1, one{...} other{...}}`
 * - Точные значения: `=0{...}`
 *
 * @param context - Контекст локализации с сообщениями и языком
 * @returns Функция перевода `translate(key, variables?)`
 *
 * @since 0.4.0
 *
 **/
export function createTranslator<TShape extends GenericShape>(context: LocalizationContext<TShape>) {

  return function translate<
    K extends keyof TShape['messages']
  >(
    key: Extract<K, string>,
    variables?: VariablesOf<TShape, K>
  ) {

    const message = context.messages[key] ?? context.fallbackAsset.messages[key]

    if (!message)
      return `{{${key}}}`

    let result: string = message

    // Шаг 1: заменяем все простые переменные {ключ} -> значение
    // Разрешены: a-z, A-Z, 0-9, _, -, .

    result = result.replace(/(?<![a-zA-Z0-9])\{([a-zA-Z0-9_.-]+)\}/g, (_, variable: string) => {

      const value = variables?.[variable]

      return value !== null && value !== undefined
        ? String(value)
        : `{${variable}}` // не заменяем, если нет в variables

    })

    const hasPlurals = result.includes('{') && (result.includes('plural') || result.includes('#'))

    if (hasPlurals) {

      const pluralRegex = /\{([^}]+),\s*plural(?:,\s*offset:(\d+))?\s*(.+)\}/g

      result = result.replace(pluralRegex, (_, variable: string, offsetPart: string, formsPart: string) => {

        const offset = offsetPart ? parseInt(offsetPart, 10) : 0

        const originalValue = Number(variables?.[variable])

        if (isNaN(originalValue)) {

          if (context.strict)
            throw LocalizationError.get('strict.invalidPluralValue', variable, variables?.[variable])

          return 'NaN'

        }

        const value = originalValue - offset

        const exactValueRegex = /=(-?\d+)\s*\{\s*([^}]+)\s*\}/g
        const exactValueForms: Record<number, string> = {}

        // Парсим =0, =1
        //
        for (const match of formsPart.matchAll(exactValueRegex)) {

          const [, valueForm, text] = match

          exactValueForms[Number(valueForm)] = text

        }

        if (value in exactValueForms)
          return exactValueForms[value].replace(/#/g, String(value))

        const formsRegex = /(one|two|few|many|other)\s*\{\s*([^}]+)\s*\}/g
        const forms: Record<string, string | undefined> = {}

        for (const match of formsPart.matchAll(formsRegex)) {

          const [, form, text] = match

          // ICU не требует 'two', но некоторые переводы могут
          // использовать его как алиас для 'few'.
          //
          const actualForm = form === 'two' ? 'few' : form

          forms[actualForm] = text

        }

        // Выбираем форму
        const form = getPluralForm(context.lang, value)

        const formText = forms[form] ?? forms['other'] ?? ''

        return formText.replace(/#/g, String(value))

      })

    }

    return result

  }

}
