import { buildPackagesAsync, getCurrentVersion, publishPackagesAsync } from '#src/utils/package'
import type { StagedArgs } from '@mirta/staged-args'
import { parseArgs } from './args'

export async function runAsync(args: StagedArgs): Promise<void> {

  // === 1. Парсинг аргументов ===

  const { values: argv } = parseArgs(args)

  const isDryRun = argv['dry-run'] ?? false
  const skipGit = argv['skip-git'] ?? false
  const skipBuild = argv['skip-build'] ?? false

  // === 2. Выполнение сборки и публикации ===

  const currentVersion = getCurrentVersion()

  await buildPackagesAsync(skipBuild)
  await publishPackagesAsync(currentVersion, skipGit, isDryRun)

}
