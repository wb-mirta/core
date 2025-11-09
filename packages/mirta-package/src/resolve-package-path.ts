import { basename, posix } from 'node:path'
import { PackageError } from './errors/package-error'
import { toPosix } from './path'

/**
 * Резолвит путь к `package.json` на основе входного пути.
 *
 * Правила:
 * - Если `path` заканчивается на `package.json` → возвращается как есть
 * - Если `path` указывает на директорию (включая `.` и `..`) → возвращается `path/package.json`
 * - Если `path` указывает на файл с расширением (например, `src/index.ts`), но не на `package.json` → ошибка
 *
 * Не выполняет проверку существования файла.
 *
 * @param path - Путь к `package.json` или к директории пакета.
 *               Может быть абсолютным или относительным.
 * @returns Абсолютный или относительный путь к `package.json`
 * @throws {PackageError} С кодом `invalidPath`, если путь указывает на файл с расширением,
 *                        но не является `package.json`.
 *
 * @example
 *
 * ```ts
 * resolvePackagePath('.')             // → './package.json'
 * resolvePackagePath('..')            // → '../package.json'
 * resolvePackagePath('packages/core') // → 'packages/core/package.json'
 * resolvePackagePath('package.json')  // → 'package.json'
 * resolvePackagePath('src/index.ts')  // → ошибка
 *
 * ```
 *
 * @since 0.4.0
 *
 **/
export function resolvePackagePath(path: string): string {

  const normalizedPath = toPosix(path)

  if (normalizedPath.endsWith('package.json'))
    return normalizedPath

  const base = basename(normalizedPath)

  // Проверяем последний фрагмент пути, не допуская файлы.
  if (base !== '.' && base !== '..' && base.includes('.'))
    throw PackageError.get('invalidPath', normalizedPath)

  return posix.join(normalizedPath, 'package.json')

}
