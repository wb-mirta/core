import { readFile } from 'node:fs/promises';
import { isExistsAsync, resolveSubpath } from '#src/utils/file-system';
import type { MirtaConfig } from './types';
import { SourceError } from '#src/errors/source-error';
import { join } from 'node:path/posix';
import jsonc from 'jsonc-parser';
import { JsoncSyntaxError } from '#src/errors/jsonc-error';

const errorMessages: ReadonlyMap<jsonc.ParseErrorCode, string> = new Map<jsonc.ParseErrorCode, string>([
  [jsonc.ParseErrorCode.InvalidSymbol, 'Invalid symbol encountered'],
  [jsonc.ParseErrorCode.InvalidNumberFormat, 'Invalid number format'],
  [jsonc.ParseErrorCode.PropertyNameExpected, 'Property name expected'],
  [jsonc.ParseErrorCode.ValueExpected, 'Value expected'],
  [jsonc.ParseErrorCode.ColonExpected, 'Colon expected'],
  [jsonc.ParseErrorCode.CommaExpected, 'Comma expected'],
  [jsonc.ParseErrorCode.CloseBraceExpected, 'Closing brace expected'],
  [jsonc.ParseErrorCode.CloseBracketExpected, 'Closing bracket expected'],
  [jsonc.ParseErrorCode.EndOfFileExpected, 'Unexpected end of file'],
  [jsonc.ParseErrorCode.InvalidCommentToken, 'Invalid comment token'],
  [jsonc.ParseErrorCode.UnexpectedEndOfComment, 'Unexpected end of comment'],
  [jsonc.ParseErrorCode.UnexpectedEndOfString, 'Unexpected end of string'],
  [jsonc.ParseErrorCode.UnexpectedEndOfNumber, 'Unexpected end of number'],
  [jsonc.ParseErrorCode.InvalidUnicode, 'Invalid Unicode escape'],
  [jsonc.ParseErrorCode.InvalidEscapeCharacter, 'Invalid escape character'],
  [jsonc.ParseErrorCode.InvalidCharacter, 'Invalid character'],
]);

function getErrorMessage(errorCode: jsonc.ParseErrorCode): string {

  return errorMessages.get(errorCode) ?? 'Unknown parsing error';

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

  return config;

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

  const errors: jsonc.ParseError[] = [];

  const parsed = jsonc.parse(content, errors, {
    allowTrailingComma: true,
  }) as unknown;

  // Проверяем, есть ли ошибки парсинга
  if (errors.length > 0) {

    const firstError = errors[0];

    throw new JsoncSyntaxError(
      getErrorMessage(firstError.error),
      firstError.offset,
      firstError.length
    );

  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {

    throw SourceError.get('parse.invalidJsonRoot');

  }

  return parsed;

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
  );

  if (!await isExistsAsync(configPath))
    return;

  try {

    const content = await readFile(configPath, 'utf-8');

    return parseConfigJson(content) as MirtaConfig;

  }
  catch (e: unknown) {

    if (e instanceof SourceError)
      throw e;

    if (e instanceof JsoncSyntaxError)
      throw e;

    if (e && typeof e === 'object' && 'code' in e) {

      switch (e.code) {

        case 'ENOENT':
          throw SourceError.get('file.notFound', configPath);

        case 'EACCES':
        case 'EPERM':
          throw SourceError.get('file.accessDenied', configPath);

      }

    }

    const message = e instanceof Error
      ? e.message
      : String(e);

    throw SourceError.get('file.failedToRead', configPath, message);

  }

}
