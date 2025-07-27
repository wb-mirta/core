import { useLogger } from './logger.js'
import { runCommandAsync } from './shell.js'

const baseUrl = 'https://api.github.com/repos/wb-mirta/core'

export function GithubError(/** @type {string} */ message) {

  Error.call(this, message)

  this.name = 'GithubError'
  this.message = message

  if (Error.captureStackTrace) {

    Error.captureStackTrace(this, GithubError)

  }
  else {

    this.stack = (new Error()).stack

  }

}

GithubError.prototype = new Error()

export function WorkflowStatusError(/** @type {string} */ message) {

  Error.call(this, message)

  this.name = 'WorkflowStatusError'
  this.message = message

  if (Error.captureStackTrace) {

    Error.captureStackTrace(this, WorkflowStatusError)

  }
  else {

    this.stack = (new Error()).stack

  }

}

WorkflowStatusError.prototype = new Error()

const logger = useLogger()

async function getShaAsync() {

  return (await runCommandAsync('git', ['rev-parse', 'HEAD'])).stdout

}

async function getBranchAsync() {

  return (await runCommandAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout

}

export async function ensureIsSyncedWithRemoteAsync() {

  let isSynced = false

  try {

    const branch = await getBranchAsync()
    const remote = await fetch(
      `${baseUrl}/commits/${branch}?per_page=1`
    )

    const data = await remote.json()
    isSynced = data.sha === await getShaAsync()

  }
  catch {

    throw new GithubError('Failed to check whether local HEAD is up-to-date with remote.')

  }

  if (!isSynced)
    throw new GithubError('Local HEAD is not up-to-date with remote.')

}

/** @param {string} name */
export async function getWorkflowResultAsync(name) {

  try {

    const sha = await getShaAsync()

    const result = await fetch(`${baseUrl}/actions/runs?head_sha=${sha}&status=completed&exclude_pull_requests=true`)

    /** @type {{ workflow_runs: ({ name: string, conclusion: string })[] }} */
    const data = await result.json()

    return data.workflow_runs.some(({ name: workflowName, conclusion }) => {

      return workflowName === name && conclusion === 'success'

    })

  }
  catch {

    logger.error('Unable to get CI status for the current commit.')
    return false

  }

}
