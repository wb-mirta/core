import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Locale, GenericShape } from './types'
import { SourceError } from './errors/source'

/**
 * Кэш загруженных сообщений по локалям.
 *
 * Хранит:
 * - `object` — успешно загруженные и замороженные сообщения
 * - `null` — признак того, что загрузка для этой локали уже провалилась (избежание повторных попыток)
 *
 * @private
 *
 **/
const loadedMessages = new Map<Locale, object | null>()

/**
 * Парсит JSON и возвращает объект.
 * Ожидает валидный JSON с корневым объектом.
 *
 * @param content - JSON-строка
 * @returns Объект сообщений
 * @throws {SourceError} Если JSON — не объект
 *
 * @since 0.4.0
 *
 **/
export function parseLocaleJson(
  content: string
): object {

  const parsed = JSON.parse(content) as unknown

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    throw SourceError.get('parse.invalidJsonRoot')

  return parsed

}

/**
 * Читает и парсит JSON-файл с сообщениями локали.
 *
 * Ожидает валидный UTF-8 и корректный JSON.
 * Результат замораживается для защиты от изменений.
 *
 * @param filePath - Путь к файлу `.json`.
 * @returns Объект сообщений.
 * @throws {SourceError} С кодами `file.notFound`, `file.accessDenied`, `parse.invalidJson` и др.
 *
 **/
export async function readLocaleFileAsync<TMessages extends object>(
  filePath: string
): Promise<TMessages> {

  try {

    const content = await readFile(filePath, 'utf-8')

    return Object.freeze(
      parseLocaleJson(content)
    ) as TMessages

  }
  catch (e: unknown) {

    if (e instanceof SourceError)
      throw e

    if (e instanceof SyntaxError)
      throw SourceError.get('parse.invalidJson', filePath, e.message)

    if (e && typeof e === 'object' && 'code' in e) {

      switch (e.code) {

        case 'ENOENT':
          throw SourceError.get('file.notFound', filePath)

        case 'EACCES':
        case 'EPERM':
          throw SourceError.get('file.accessDenied', filePath)

      }

    }

    const message = e instanceof Error
      ? e.message
      : String(e)

    throw SourceError.get('file.failedToRead', filePath, message)

  }

}

/**
 * Загружает сообщения для указанной локали.
 *
 * Использует кэш: повторные вызовы не читают файл.
 * При неудаче кэшируется `null` — попытки не повторяются.
 *
 * @param locale - Локаль в формате `xx-XX` (например, `ru-RU`).
 * @param cwd - Базовая директория (обычно `process.cwd()`).
 * @returns Сообщения или `null`, если загрузить не удалось.
 *
 * @remarks
 * Ошибки, связанные с отсутствием файла (`file.notFound`), перехватываются.
 *
 * Остальные ошибки (невалидный JSON, нет доступа) пробрасываются,
 * поскольку указывают на критические проблемы.
 *
 * @since 0.4.0
 *
 **/
export async function loadMessagesAsync<TShape extends GenericShape>(
  locale: Locale,
  cwd: string
): Promise<TShape['messages'] | null> {

  let messages = loadedMessages.get(locale)

  if (messages || messages === null)
    return messages as TShape['messages'] | null

  const filePath = resolve(cwd, './locales', `${locale}.json`)

  try {

    messages = await readLocaleFileAsync<TShape['messages']>(filePath)

    loadedMessages.set(locale, messages)

    return messages as TShape['messages']

  }
  catch (e: unknown) {

    if (SourceError.isFileError(e) && e.code === 'file.notFound') {

      loadedMessages.set(locale, null)

      return null

    }

    throw e

  }

}

/**
 * Сбрасывает внутреннее состояние.
 *
 * Используется исключительно в тестах для обеспечения изоляции.
 *
 * @internal
 *
 * @since 0.4.0
 *
 **/
export function __resetInternalState() {

  if (!__TEST__)
    return

  loadedMessages.clear()

}
