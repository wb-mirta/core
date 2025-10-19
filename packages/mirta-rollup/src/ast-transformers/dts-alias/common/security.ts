import nodePath from 'node:path'

import { AstTransformError } from '#utils/errors'

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
 * ensurePathIsValid('./utils') // OK
 * ensurePathIsValid('http://malicious.com') // Выбросит ошибку
 *
 * ```
 * @since 0.3.5
 *
 **/
export function ensurePathIsValid(path: string) {

  if (path.includes(':') || path.includes('~'))
    throw AstTransformError.get('invalidPathFormat', path)

}

/**
 * Проверяет, находится ли указанный файл внутри корневой директории проекта.
 *
 * Эта функция гарантирует, что файл `fileName` не выходит за пределы корневой директории `rootDir`.
 * Если относительный путь от `rootDir` к `fileName` содержит `..`, это означает, что файл находится вне
 * корня, и функция выбрасывает ошибку для предотвращения небезопасного доступа.
 *
 * @param rootDir - Корневая директория проекта.
 * @param fileName - Путь к файлу, который необходимо проверить.
 * @throws {AstTransformError} Если файл находится вне корневой директории.
 *
 * @example
 *
 * ```ts
 * ensurePathWithinRoot('/project/src', '/project/src/utils/index.ts') // OK
 * ensurePathWithinRoot('/project/src', '/project/../README.md') // Выбросит ошибку
 *
 * ```
 * @since 0.3.5
 *
 **/
export function ensurePathWithinRoot(rootDir: string, fileName: string) {

  if (nodePath.relative(rootDir, fileName).startsWith('..'))
    throw AstTransformError.get('pathOutsideRootDirectory', fileName)

}
