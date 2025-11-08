import { readFileSync } from 'node:fs'
import { PackageError } from './errors/package-error'
import { resolvePackagePath } from './resolve-package-path'
import { parsePackageJson } from './parse-package-json'

/**
 * Синхронно читает и парсит `package.json` по указанному пути.
 *
 * Поддерживается:
 * - Прямой путь к файлу — `'package.json'`, `'packages/core/package.json'`
 * - Путь к корневой директории пакета — `'.'`, `'..'`, `'../../shared'`, `'packages/core'`
 *
 * Не поддерживается:
 * - Передача пути к произвольному файлу — `'src/index.ts'`
 *
 * При ошибках чтения файла или невалидном JSON выбрасывается {@link PackageError}
 * с подробным описанием и контекстом.
 *
 * @param path - Путь к `package.json` или к корневой директории пакета.
 * @returns  Объект типа {@link Package}, представляющий минимальный контракт,
 *           необходимый для разрешения структуры монорепозитория и сборки проектов.
 * @throws {PackageError} Если файл не найден, нет доступа или JSON повреждён.
 *
 * @since 0.4.0
 *
 **/
export function readPackage(path: string) {

  const resolvedPath = resolvePackagePath(path)

  try {

    const content = readFileSync(resolvedPath, 'utf-8')

    return parsePackageJson(content)

  }
  catch (e: unknown) {

    if (e instanceof PackageError)
      throw e

    if (e instanceof SyntaxError)
      throw PackageError.get('invalidJson', resolvedPath, e.message)

    if (e && typeof e === 'object' && 'code' in e) {

      const code = e.code

      switch (code) {
        case 'ENOENT':
          throw PackageError.get('notFound', resolvedPath)
        case 'EACCES':
        case 'EPERM':
          throw PackageError.get('accessDenied', resolvedPath)
      }

    }

    const msg = e instanceof Error ? e.message : String(e)
    throw PackageError.get('failedToRead', resolvedPath, msg)

  }

}
