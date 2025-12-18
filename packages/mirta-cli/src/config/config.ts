import fs from 'node:fs/promises'
import { isExistsAsync, resolveSubpath } from '#src/utils/file-system'
import type { MirtaConfig } from './types'
import { SourceError } from '#src/errors/source-error'
import { join } from 'node:path/posix'

export function defineConfig(config: MirtaConfig): MirtaConfig {

  return config

}

export function parseConfigJson(
  content: string
): object {

  const parsed = JSON.parse(content) as unknown

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    throw SourceError.get('parse.invalidJsonRoot')

  return parsed

}

export async function readConfigAsync(rootDir: string, pathInput: string): Promise<MirtaConfig | undefined> {

  const configPath = join(
    rootDir,
    resolveSubpath(rootDir, pathInput)
  )

  if (!await isExistsAsync(configPath))
    return

  try {

    const content = await fs.readFile(configPath, 'utf-8')

    return parseConfigJson(content) as MirtaConfig

  }
  catch (e: unknown) {

    if (e instanceof SourceError)
      throw e

    if (e instanceof SyntaxError)
      throw SourceError.get('parse.invalidJson', configPath, e.message)

    if (e && typeof e === 'object' && 'code' in e) {

      switch (e.code) {

        case 'ENOENT':
          throw SourceError.get('file.notFound', configPath)

        case 'EACCES':
        case 'EPERM':
          throw SourceError.get('file.accessDenied', configPath)

      }

    }

    const message = e instanceof Error
      ? e.message
      : String(e)

    throw SourceError.get('file.failedToRead', configPath, message)

  }

}
