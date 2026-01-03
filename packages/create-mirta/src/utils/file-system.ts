import { resolve } from 'node:path'
import fs from 'node:fs/promises'

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
  catch (e: unknown) {

    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT')
      return false

    throw e

  }

}

export async function isDirEmptyAsync(targetDir: string): Promise<boolean> {

  const files = await fs.readdir(targetDir)

  return !files.length || (files.length === 1 && files[0] === '.git')

}

export async function clearDirAsync(targetDir: string): Promise<void> {

  for (const filename of await fs.readdir(targetDir)) {

    if (filename === '.git')
      continue

    await fs.rm(resolve(targetDir, filename), {
      recursive: true,
      force: true,
    })

  }

}
