import { LocalizationError } from './errors'
import type { LocalizationContext, GenericShape, PluralForm, VariablesOf, Lang, MessageVariable, ContextBase } from './types'

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
 * Извлекает сбалансированный блок `{...}` с учётом вложенности.
 *
 * @param message - Строка для поиска.
 * @param index - Позиция, с которой начинается блок `{`.
 * @param limit - Ограничение по длине строки.
 *
 * @returns Объект с `content` (содержимым) и `end` (индексом после `}`) или `null`, если блок несбалансирован.
 *
 * @example
 * extractBalanced('{hello}', 0, 7) // → { content: 'hello', end: 7 }
 *
 * @example
 * extractBalanced('{a{b}c}', 0, 7) // → { content: 'a{b}c', end: 7 }
 *
 * @example
 * extractBalanced('{unclosed', 0, 9) // → null
 *
 * @since 0.4.0
 *
 **/
export function extractBalanced(message: string, index: number, limit: number): { content: string, end: number } | null {

  if (message[index] !== '{')
    return null

  let depth = 1

  let i = index + 1

  while (i < limit && depth > 0) {

    if (message[i] === '{')
      depth++
    else if (message[i] === '}')
      depth--

    i++

  }

  if (depth !== 0)
    return null

  return {
    end: i,
    content: message.slice(index + 1, i - 1),
  }

}

/**
 * Подставляет значения переменных в строку вида `{ключ}`.
 *
 * @param text - Строка с плейсхолдерами.
 * @param variables - Объект с данными для подстановки.
 *
 * @returns Строка с заменёнными значениями или оригинальные плейсхолдеры, если значения не найдены.
 *
 * @example
 * interpolate('Привет, {name}!', { name: 'Мира' }) // → 'Привет, Мира!'
 *
 * @example
 * interpolate('Значение: {missing}', {}) // → 'Значение: {missing}'
 *
 * @since 0.4.0
 *
 **/
export function interpolate(text: string, variables: Record<string, MessageVariable> | undefined): string {

  let result = ''
  let pos = 0
  let start = 0
  const len = text.length

  while (pos < len) {

    if (text[pos] === '{') {

      result += text.slice(start, pos)

      const block = extractBalanced(text, pos, len)

      if (!block) {

        result += '{'
        pos++
        start = pos

        continue

      }

      const { content, end } = block
      const value = variables?.[content]

      result += value != null ? String(value) : `{${content}}`
      pos = end
      start = pos

    }
    else {

      pos++

    }

  }

  result += text.slice(start)
  return result

}

/**
 * Разбирает часть сообщения с формами множественного числа (например, `one{...} other{...}`).
 *
 * Извлекает ключи (`one`, `other`, `=0` и т.д.) и соответствующие им содержимое,
 * корректно обрабатывая вложенность фигурных скобок. Поддерживает точные значения (`=n`) и
 * преобразует `two` в `few` в соответствии с правилами ICU.
 *
 * @param formsPart - Строка, содержащая последовательность `ключ{...}`.
 *
 * @returns Объект с двумя полями:
 * - `exactForms` — карта точных значений (`=n`) и их содержимого;
 * - `commonForms` — карта именованных форм (`one`, `other` и др.).
 *
 * @since 0.4.0
 *
 **/
function parseFormsPart(formsPart: string) {

  const exactForms: Record<number, string> = {}
  const commonForms: Record<string, string | undefined> = {}

  let pos = 0
  let keyBuffer = '' // будем набирать ключ

  const len = formsPart.length

  while (pos < len) {

    const char = formsPart[pos]

    if (char === '{') {

      // Встретили `{` → текущий буфер — это ключ
      const key = keyBuffer.trim()

      keyBuffer = ''

      if (!key) {

        // Пустой ключ — пропускаем
        pos++
        continue

      }

      // Извлекаем сбалансированное тело
      const block = extractBalanced(formsPart, pos, len)

      if (!block) {

        pos++
        continue

      }

      // Сохраняем
      if (key.startsWith('=')) {

        const num = parseInt(key.slice(1), 10)

        exactForms[num] = block.content

      }
      else {

        // ICU: 'two' → treat as 'few'
        const formKey = key === 'two' ? 'few' : key

        commonForms[formKey] = block.content

      }

      // Продолжаем после блока
      pos = block.end

    }
    else {

      // Накапливаем символы в буфере
      keyBuffer += char
      pos++

    }

  }

  return { exactForms, commonForms }

}

/**
 * Обрабатывает конструкцию `plural` в формате ICU.
 *
 * @param content - Содержимое блока, например: `count, plural, one{...} other{...}`.
 * @param variables - Переменные для подстановки значений.
 * @param context - Контекст локализации (язык, strict-режим).
 *
 * @returns Обработанную строку с нужной формой и подставленным числом, или ошибку в strict-режиме.
 *
 * @since 0.4.0
 *
 **/
export function parsePlural(content: string, variables: Record<string, MessageVariable> | undefined, context: ContextBase): string {

  // Парсим: {count, plural, offset:1, one{...} other{...}}
  const match = /([^}]+),\s*plural,\s*(?:offset:(\d+)\s*)?(.+)/g.exec(content)

  if (!match) {

    if (context.strict)
      throw new Error('Invalid plural format')

    return ''

  }

  const [, variable, offsetPart, formsPart] = match

  const offset = offsetPart ? parseInt(offsetPart, 10) : 0

  const originalValue = Number(variables?.[variable])

  if (isNaN(originalValue)) {

    if (context.strict)
      throw LocalizationError.get('strict.invalidPluralValue', variable, variables?.[variable])

    return 'NaN'

  }

  const value = originalValue - offset

  const { exactForms, commonForms } = parseFormsPart(formsPart)

  // Обрабатываем =0{...}, =1{...}

  if (value in exactForms)
    return exactForms[value].replace(/#/g, String(value))

  // Обрабатываем one{...}, few{...}, other{...}

  const form = getPluralForm(context.lang, value)
  const formText = commonForms[form] ?? commonForms.other ?? ''

  return formText.replace(/#/g, String(value))

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

  const translate = <
    K extends keyof TShape['messages']
  >(
    key: Extract<K, string>,
    variables?: VariablesOf<TShape, K>
  ) => {

    const message = context.messages[key] ?? context.fallbackAsset.messages[key]

    if (!message)
      return `{{${key}}}`

    let result = ''
    let pos = 0
    let start = 0
    const len = message.length

    // Основной цикл
    while (pos < len) {

      if (message[pos] === '{') {

        // Добавить текст до {
        result += message.slice(start, pos)

        const block = extractBalanced(message, pos, len)

        if (!block) {

          result += '{'
          pos++
          start = pos
          continue

        }

        const { content, end } = block

        if (/^\s*[a-zA-Z0-9_.-]+\s*,\s*plural\b/.test(content)) {

          result += interpolate(
            parsePlural(content, variables, context),
            variables
          )

        }
        else {

          // Простая переменная: {name}
          const value = variables?.[content]

          result += value != null ? String(value) : `{${content}}`

        }

        pos = end
        start = pos

      }
      else {

        pos++

      }

    }

    // Добавить остаток
    result += message.slice(start)

    return result

  }

  translate.plain = (
    key: string,
    fallbackValue?: string
  ) => {

    const message = context.messages[key]
      ?? context.fallbackAsset.messages[key]
      ?? fallbackValue
      ?? `{{${key}}}`

    return message

  }

  return translate

}
