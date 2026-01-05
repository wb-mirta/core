import { readFile } from 'node:fs/promises'
import { isExistsAsync, resolveSubpath } from '#src/utils/file-system'
import type { MirtaConfig } from './types'
import { SourceError } from '#src/errors/source-error'
import { join } from 'node:path/posix'
import jsonc from 'jsonc-parser'
import { JsoncSyntaxError } from '#src/errors/jsonc-error'

function getErrorMessage(errorCode: jsonc.ParseErrorCode): string {

  switch (errorCode) {
    case jsonc.ParseErrorCode.InvalidSymbol:
      return 'Invalid symbol encountered'
    case jsonc.ParseErrorCode.InvalidNumberFormat:
      return 'Invalid number format'
    case jsonc.ParseErrorCode.PropertyNameExpected:
      return 'Property name expected'
    case jsonc.ParseErrorCode.ValueExpected:
      return 'Value expected'
    case jsonc.ParseErrorCode.ColonExpected:
      return 'Colon expected'
    case jsonc.ParseErrorCode.CommaExpected:
      return 'Comma expected'
    case jsonc.ParseErrorCode.CloseBraceExpected:
      return 'Closing brace expected'
    case jsonc.ParseErrorCode.CloseBracketExpected:
      return 'Closing bracket expected'
    case jsonc.ParseErrorCode.EndOfFileExpected:
      return 'Unexpected end of file'
    case jsonc.ParseErrorCode.InvalidCommentToken:
      return 'Invalid comment token'
    case jsonc.ParseErrorCode.UnexpectedEndOfComment:
      return 'Unexpected end of comment'
    case jsonc.ParseErrorCode.UnexpectedEndOfString:
      return 'Unexpected end of string'
    case jsonc.ParseErrorCode.UnexpectedEndOfNumber:
      return 'Unexpected end of number'
    case jsonc.ParseErrorCode.InvalidUnicode:
      return 'Invalid Unicode escape'
    case jsonc.ParseErrorCode.InvalidEscapeCharacter:
      return 'Invalid escape character'
    case jsonc.ParseErrorCode.InvalidCharacter:
      return 'Invalid character'
    default:
      return 'Unknown parsing error'
  }

}

/**
 * Обёртка для определения конфигурации. Позволяет использовать подсказки типов TypeScript.
 *
 * На этапе выполнения просто возвращает переданный объект без изменений.
 * Предназначена для улучшения DX (developer experience).
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   deploy: {
 *     profiles: { ... }
 *   }
 * })
 * ```
 * @param config - Объект конфигурации Mirta.
 * @returns Тот же объект, что и входе.
 *
 * @since 0.4.0
 *
 **/
export function defineConfig(config: MirtaConfig): MirtaConfig {

  return config

}

/**
 * Парсит строку JSON и проверяет, что корневой элемент — это объект (не массив и не примитив).
 *
 * Используется для валидации содержимого конфигурационного файла перед приведением к типу `MirtaConfig`.
 *
 * @param content - Строка с содержимым JSON-файла.
 * @returns Распарсенный объект.
 * @throws {SourceError} Если JSON имеет неверный формат или корень не является объектом.
 *
 * @since 0.4.0
 *
 **/
export function parseConfigJson(content: string): object {

  const errors: jsonc.ParseError[] = []

  const parsed = jsonc.parse(content, errors) as unknown

  // Проверяем, есть ли ошибки парсинга
  if (errors.length > 0) {

    const firstError = errors[0]

    throw new JsoncSyntaxError(
      getErrorMessage(firstError.error),
      firstError.offset,
      firstError.length
    )

  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {

    throw SourceError.get('parse.invalidJsonRoot')

  }

  return parsed

}

/**
 * Асинхронно читает и парсит конфигурационный файл.
 *
 * @param rootDir - Корневая директория проекта.
 * @param pathInput - Относительный путь к конфигурационному файлу (например, 'mirta.config.json').
 * @returns Объект конфигурации или `undefined`, если файл не существует.
 * @throws {SourceError} С различными кодами ошибок в зависимости от типа проблемы:
 * - `parse.invalidJson` — невалидный JSON
 * - `file.notFound` — файл не найден
 * - `file.accessDenied` — нет прав на чтение
 * - `file.failedToRead` — другие ошибки чтения
 *
 * @since 0.4.0
 *
 **/
export async function readConfigAsync(rootDir: string, pathInput: string): Promise<MirtaConfig | undefined> {

  const configPath = join(
    rootDir,
    resolveSubpath(rootDir, pathInput)
  )

  if (!await isExistsAsync(configPath))
    return

  try {

    const content = await readFile(configPath, 'utf-8')

    return parseConfigJson(content) as MirtaConfig

  }
  catch (e: unknown) {

    if (e instanceof SourceError)
      throw e

    if (e instanceof JsoncSyntaxError)
      throw e

    if (e && typeof e === 'object' && 'code' in e) {

      switch (e.code) {

        case 'ENOENT':
          throw SourceError.get('file.notFound', configPath)

        case 'EACCES':
        case 'EPERM':
          throw SourceError.get('file.accessDenied', configPath)

      }

    }

    const message = e instanceof Error
      ? e.message
      : String(e)

    throw SourceError.get('file.failedToRead', configPath, message)

  }

}
