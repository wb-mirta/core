import { buildPackagesAsync, getCurrentVersion, publishPackagesAsync } from '#src/utils/package'
import type { StagedArgs } from '#src/utils/staged-args'
import { parseArgs } from './args'

export async function runAsync(args: StagedArgs): Promise<void> {

  // === 1. Парсинг аргументов ===

  const { values: argv } = parseArgs(args)

  const isDryRun = argv['dry-run']
  const skipGit = argv['skip-git']
  const skipBuild = argv['skip-build']

  // === 2. Выполнение сборки и публикации ===

  const currentVersion = getCurrentVersion()

  await buildPackagesAsync(skipBuild)
  await publishPackagesAsync(currentVersion, skipGit, isDryRun)

}
