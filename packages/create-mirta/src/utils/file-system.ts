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

export async function isDirEmptyAsync(targetDir: string) {

  const files = await fs.readdir(targetDir)

  return !files.length || (files.length === 1 && files[0] === '.git')

}

export async function clearDirAsync(targetDir: string) {

  for (const filename of await fs.readdir(targetDir)) {

    if (filename === '.git')
      continue

    await fs.rm(resolve(targetDir, filename), {
      recursive: true,
      force: true,
    })

  }

}

// export function canSkipDir(targetDir: string) {

//   if (!existsSync(targetDir))
//     return true

//   const files = readdirSync(targetDir)

//   if (files.length === 0)
//     return true

//   if (files.length === 1 && files[0] === '.git')
//     return true

//   return false

// }

// export const dotGitDirectoryState = {
//   hasDotGitDirectory: false,
// }

// type PathCallback = (path: string) => void

// function postOrderDirectoryTraverse(
//   dir: string,
//   dirCallback: PathCallback,
//   fileCallback: PathCallback
// ) {

//   for (const filename of readdirSync(dir)) {

//     if (filename === '.git') {

//       dotGitDirectoryState.hasDotGitDirectory = true
//       continue

//     }

//     const fullpath = resolve(dir, filename)

//     if (lstatSync(fullpath).isDirectory()) {

//       postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
//       dirCallback(fullpath)
//       continue

//     }

//     fileCallback(fullpath)

//   }

// }

// export function emptyDir(targetDir: string) {

//   if (!existsSync(targetDir))
//     return

//   postOrderDirectoryTraverse(
//     targetDir,
//     (path) => {

//       rmdirSync(path)

//     },
//     (path) => {

//       unlinkSync(path)

//     }
//   )

// }
