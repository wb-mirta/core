import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { PackageError } from './errors/package-error'
import { resolvePackagePath } from './resolve-package-path'
import { parsePackageJson } from './parse-package-json'

/**
 * Обрабатывает ошибку, возникшую при чтении или парсинге файла `package.json`,
 * и преобразует её в соответствующую ошибку типа {@link PackageError}.
 *
 * @param e - Неизвестное исключение, которое необходимо обработать.
 * @param path - Путь к файлу `package.json`, на котором произошла ошибка.
 * @returns Экземпляр {@link PackageError}, соответствующий типу исключения.
 *
 * @since 0.4.0
 *
 **/
function handleError(e: unknown, path: string) {

  if (e instanceof PackageError)
    return e

  if (e instanceof SyntaxError)
    return PackageError.get('invalidJson', path, e.message)

  if (e && typeof e === 'object' && 'code' in e) {

    const code = e.code as string
    switch (code) {
      case 'ENOENT':
        return PackageError.get('notFound', path)
      case 'EACCES':
      case 'EPERM':
        return PackageError.get('accessDenied', path)
    }

  }

  const message = e instanceof Error
    ? e.message
    : String(e)

  return PackageError.get('failedToRead', path, message)

}

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

  let content: string

  try {

    content = readFileSync(resolvedPath, 'utf-8')

    return parsePackageJson(content)

  }
  catch (e: unknown) {

    throw handleError(e, resolvedPath)

  }

}

/**
 * Асинхронно читает и парсит `package.json` по указанному пути.
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
 * @returns Объект типа {@link Package}, представляющий минимальный контракт.
 * @throws {PackageError} Если файл не найден, нет доступа или JSON повреждён.
 *
 * @since 0.4.0
 *
 **/
export async function readPackageAsync(path: string) {

  const resolvedPath = resolvePackagePath(path)

  let content: string

  try {

    content = await readFile(resolvedPath, 'utf-8')

  }
  catch (e: unknown) {

    throw handleError(e, resolvedPath)

  }

  return parsePackageJson(content)

}
