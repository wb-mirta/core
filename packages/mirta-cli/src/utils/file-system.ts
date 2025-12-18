import { SourceError } from '#src/errors/source-error'
import { toPosix } from '@mirta/package'
import fs from 'node:fs/promises'
import { resolve, sep, relative } from 'node:path'

export async function isExistsAsync(p: string): Promise<boolean> {

  try {

    await fs.access(p)

    return true

  }
  catch {

    return false

  }

}

export function resolveSubpath(rootDir: string, targetPath: string) {

  const resolvedRoot = resolve(rootDir)
  const resolvedTarget = resolve(resolvedRoot, targetPath)

  const relativePath = relative(resolvedRoot, resolvedTarget)

  if (relativePath.startsWith('..') || relativePath.includes(`${sep}..`))
    throw SourceError.get('path.outsideRoot', targetPath)

  return toPosix(relativePath)

}
