import type { MirtaConfig } from './types'
import { readConfigAsync } from './config'
import { DEFAULT_CONFIG_FILE } from './constants'
import { deepMerge } from '@mirta/basics/object'
import defaultConfig from './default'
import { SourceError } from '#src/errors/source-error'

export interface ResolvedConfig {

  config: MirtaConfig
  userConfig?: MirtaConfig

}

export async function resolveConfigAsync(
  rootDir: string,
  path?: string
): Promise<ResolvedConfig> {

  const userConfig = await readConfigAsync(rootDir, path ?? DEFAULT_CONFIG_FILE)

  if (!userConfig && path)
    throw SourceError.get('file.notFound', path)

  return {
    config: deepMerge(defaultConfig, userConfig),
    userConfig,
  }

}
