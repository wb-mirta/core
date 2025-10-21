import { runCommandAsync } from '#utils/shell'

export type ConnectionType = 'ssh' | 'https'

const baseUrl = 'https://api.github.com/repos'

/** Класс ошибки уровня Git. */
export class GitError extends Error {
  constructor(message: string) {

    super(message)

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, GitError.prototype)

    this.name = 'GitError'
    this.message = message

    Error.captureStackTrace(this, GitError)

  }
}

/** Класс ошибки уровня взаимодействия GitHub. */
export class GithubError extends Error {
  constructor(message: string) {

    super(message)

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, GithubError.prototype)

    this.name = 'GithubError'
    this.message = message

    Error.captureStackTrace(this, GithubError)

  }
}

/** Класс ошибки уровня GitHub Workflow. */
export class WorkflowStatusError extends Error {
  constructor(message: string) {

    super(message)

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, WorkflowStatusError.prototype)

    this.name = 'WorkflowStatusError'
    this.message = message

    Error.captureStackTrace(this, WorkflowStatusError)

  }
}

/** Определяет, находится ли текущее решение в рабочем дереве Git. */
export async function checkIsInWorkTreeAsync() {

  try {

    const { stdout } = await runCommandAsync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'pipe' })

    return stdout === 'true'

  }
  catch {

    return false

  }

}

const getConnectionType = (url: string): ConnectionType | undefined => {

  if (url.startsWith('git@'))
    return 'ssh'

  if (url.startsWith('https://'))
    return 'https'

}

/** Возвращает имя репозитория и тип подключения. */
export async function getRepositoryDetails() {

  const { stdout, stderr } = await runCommandAsync('git', ['config', 'remote.origin.url'], { stdio: 'pipe' })

  if (stderr)
    throw new GitError(stderr)

  // Match the URLs like:
  // git@github.com:wb-mirta/core.git
  // https://github.com/wb-mirta/core.git
  //
  const regex = /^(?:git@|https:\/\/)(?:[^/:]+)[/:]?(.*?).git$/i

  const match = regex
    .exec(stdout)

  if (!match?.[1])
    throw new GitError(`Unable to detect remote origin url`)

  return {
    name: match[1],
    connectionType: getConnectionType(stdout),
  }

}

/** Возвращает SHA текущего HEAD. */
async function getShaAsync() {

  return (await runCommandAsync('git', ['rev-parse', 'HEAD'])).stdout

}

/** Возвращает имя текущей ветки. */
async function getBranchAsync() {

  return (await runCommandAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout

}

/** Проверяет, синхронизирован ли текущий HEAD с удаленным. */
export async function assertIsSyncedWithRemoteAsync(repository: string) {

  let isSynced = false

  try {

    const branch = await getBranchAsync()
    const remote = await fetch(
      `${baseUrl}/${repository}/commits/${branch}?per_page=1`
    )

    const data = await remote.json() as { sha: string }
    isSynced = data.sha === await getShaAsync()

  }
  catch {

    throw new GithubError('Failed to check whether local HEAD is up-to-date with remote')

  }

  if (!isSynced)
    throw new GithubError('Local HEAD is not up-to-date with remote')

}

/** Проверяет успешность CI-построения последнего коммита. */
export async function assertWorkflowResultAsync(repository: string, name: string) {

  let isBuildPassed = false

  try {

    const sha = await getShaAsync()

    const result = await fetch(`${baseUrl}/${repository}/actions/runs?head_sha=${sha}&status=completed&exclude_pull_requests=true`)

    const data = await result.json() as {
      workflow_runs: ({ name: string, conclusion: string })[]
    }

    isBuildPassed = data.workflow_runs.some(
      ({ name: workflowName, conclusion }) =>
        workflowName.toLowerCase() === name.toLowerCase()
        && conclusion === 'success'
    )

  }
  catch {

    throw new GithubError('Unable to get CI status for the current commit')

  }

  if (!isBuildPassed)
    throw new WorkflowStatusError('CI build of the latest commit has not passed yet')

}
