import { AstTransformError } from '#utils/errors';

/**
 * Проверяет безопасность пути модуля, блокируя подозрительные символы.
 *
 * Эта функция проверяет, не содержит ли путь модуля недопустимых символов,
 * таких как `:` (используется в URL) или `~` (ссылка на домашнюю директорию),
 * которые могут представлять риск безопасности.
 *
 * @param path - Путь модуля для проверки.
 *
 * @throws {AstTransformError} Если обнаружены запрещённые символы.
 *
 * @example
 * ```ts
 * assertPathIsValid('./utils') // OK
 * assertPathIsValid('http://malicious.com') // Выбросит ошибку
 *
 * ```
 * @since 0.3.5
 *
 **/
export function assertPathIsValid(path: string) {

  if (path.includes(':') || path.includes('~'))
    throw AstTransformError.get('invalidChars', path);

}
