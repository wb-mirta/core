import { existsSync, readdirSync, lstatSync, rmdirSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

export function canSkipDir(targetDir: string) {

  if (!existsSync(targetDir))
    return true

  const files = readdirSync(targetDir)

  if (files.length === 0)
    return true

  if (files.length === 1 && files[0] === '.git')
    return true

  return false

}

export const dotGitDirectoryState = {
  hasDotGitDirectory: false,
}

type PathCallback = (path: string) => void

function postOrderDirectoryTraverse(
  dir: string,
  dirCallback: PathCallback,
  fileCallback: PathCallback
) {

  for (const filename of readdirSync(dir)) {

    if (filename === '.git') {

      dotGitDirectoryState.hasDotGitDirectory = true
      continue

    }

    const fullpath = resolve(dir, filename)

    if (lstatSync(fullpath).isDirectory()) {

      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      dirCallback(fullpath)
      continue

    }

    fileCallback(fullpath)

  }

}

export function emptyDir(targetDir: string) {

  if (!existsSync(targetDir))
    return

  postOrderDirectoryTraverse(
    targetDir,
    (path) => {

      rmdirSync(path)

    },
    (path) => {

      unlinkSync(path)

    }
  )

}
