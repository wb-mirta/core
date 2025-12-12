import { assertIsSyncedWithRemoteAsync, assertWorkflowResultAsync, getRepositoryDetails } from '#src/utils/github'
import { useLogger } from '#src/utils/logger'
import chalk from 'chalk'
import type { ReleaseContext } from './types'

const logger = useLogger()
const { yellow } = chalk

export async function runGitChecksAsync(
  context: Pick<ReleaseContext, 'inWorkTree' | 'skipGit'>
): Promise<Pick<ReleaseContext, 'repository' | 'connectionType'>> {

  if (!context.inWorkTree || context.skipGit)
    return {}

  const repoDetails = await getRepositoryDetails()
  const { name: repository, connectionType } = repoDetails

  logger.log(`Repository: ${yellow(repository)}`)
  await assertIsSyncedWithRemoteAsync(repository)

  logger.step('Ensuring CI status for HEAD...')
  await assertWorkflowResultAsync(repository, 'build')

  return { repository, connectionType }

}
