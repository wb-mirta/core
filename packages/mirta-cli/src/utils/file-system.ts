import { SourceError } from '#src/errors/source-error'
import { toPosix } from '@mirta/package'
import fs from 'node:fs/promises'
import { resolve, sep, relative } from 'node:path'

/**
 * Асинхронно проверяет, существует ли файл или директория по указанному пути.
 *
 * Использует `fs.access`, чтобы обойти ограничения `fs.existsSync` в асинхронной среде.
 *
 * @param path - Путь к файлу или директории.
 * @returns `true`, если путь существует и доступен, иначе `false`.
 *
 * @since 0.4.0
 *
 **/
export async function isExistsAsync(path: string): Promise<boolean> {

  try {

    await fs.access(path)

    return true

  }
  catch {

    return false

  }

}

/**
 * Разрешает относительный путь внутри заданной корневой директории.
 *
 * Проверяет, что итоговый путь не выходит за пределы `rootDir` (защита от `../../../` атак).
 * Возвращает путь в POSIX-формате (с `/`), независимо от ОС.
 *
 * @param rootDir - Корневая директория, внутри которой должно происходить разрешение.
 * @param targetPath - Целевой путь (может быть относительным или абсолютным).
 * @returns Относительный путь от `rootDir` в формате POSIX.
 * @throws {SourceError} Если результирующий путь находится вне `rootDir`.
 *
 * @since 0.4.0
 *
 **/
export function resolveSubpath(rootDir: string, targetPath: string) {

  const resolvedRoot = resolve(rootDir)
  const resolvedTarget = resolve(resolvedRoot, targetPath)

  const relativePath = relative(resolvedRoot, resolvedTarget)

  if (relativePath.startsWith('..') || relativePath.includes(`${sep}..`))
    throw SourceError.get('path.outsideRoot', targetPath)

  return toPosix(relativePath)

}
