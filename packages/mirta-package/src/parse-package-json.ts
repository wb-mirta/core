import { PackageError } from './errors'
import type { Package } from './types'

/**
 * Парсит строку JSON и возвращает объект типа {@link Package}.
 *
 * Не выполняет чтение из файловой системы.
 *
 * @param content - Строка в формате JSON
 * @returns Объект типа {@link Package}
 * @throws {SyntaxError} Если JSON некорректен.
 *                       Сообщение содержит детали: позицию, причину.
 *
 * @throws {PackageError} Если JSON не является объектом.
 *
 * @example
 *
 * ```ts
 * parsePackageJson('{ "name": "my-package" }')
 *
 * ```
 * @since 0.4.0
 *
 **/
export function parsePackageJson(content: string) {

  const parsed = JSON.parse(content) as unknown

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    throw PackageError.get('invalidJsonRoot')

  return parsed as Package

}
