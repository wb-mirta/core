import { t } from '#i18n/index'
import { logger } from '#utils/logger'
import { prompts } from '#utils/prompts'

const DEFAULT_BRANCH = 'main'

interface GithubInfo {

  owner: string
  repository: string
  branch: string

}

export async function resolveGithubInfoAsync(
  input?: string
): Promise<GithubInfo> {

  let owner: string | undefined
  let repository: string | undefined
  let branch: string | undefined

  if (input) {

    const match = /^([^/]+)\/([^#]+)(?:#(.+))?$/.exec(input)

    if (match) {

      owner = match[1]
      repository = match[2]
      branch = match[3]

    }

    if (owner && repository)
      return {
        owner: owner.trim(),
        repository: repository.trim(),
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        branch: branch?.trim() || DEFAULT_BRANCH,
      }

  }

  logger.step(t('github.caption'))

  const answer = await prompts([
    {
      type: 'text',
      name: 'owner',
      message: t('github.owner.prompt'),
      initial: owner,
      validate: (value: string) => {

        if (value.trim().length === 0)
          return t('validation.required')
        else
          return true

      },
    },
    {
      type: 'text',
      name: 'repository',
      message: t('github.repository.prompt'),
      initial: repository,
      validate: (value: string) => {

        if (value.trim().length === 0)
          return t('validation.required')
        else
          return true

      },
    },
    {
      type: 'text',
      name: 'branch',
      message: t('github.branch.prompt'),
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      initial: branch || DEFAULT_BRANCH,
    },
  ]) as { owner: string, repository: string, branch: string | undefined }

  owner = answer.owner.trim()
  repository = answer.repository.trim()
  branch = answer.branch?.trim()

  return {

    owner,
    repository,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    branch: branch || DEFAULT_BRANCH,

  }

}
