import { getLocalized } from '#utils/localization'
import { useLogger } from '#utils/logger'
import { PromptCanceledError } from '#utils/prompts'
import { ShellError } from '#utils/shell'
import { GitError, GithubError, WorkflowStatusError } from './utils/github'

const messages = await getLocalized()
const logger = useLogger(messages)

async function run() {

  const command = process.argv[2]

  if (command === 'release') {

    await import('./release')

  }
  else if (command === 'publish') {

    await import('./publish')

  }

}

function prettify(message: string, name?: string) {

  if (name && message.startsWith(name))
    return message.slice(name.length)

  return message

}

run().catch((e: unknown) => {

  if (e instanceof GitError || e instanceof GithubError || e instanceof WorkflowStatusError || e instanceof ShellError) {

    logger.error(prettify(e.message, e.name))

  }
  else if (e instanceof PromptCanceledError) {

    logger.cancel(messages.errors.operationCanceled)

  }
  else if (e instanceof Error && 'code' in e) {

    // if (e.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION')
    // if (e.code === 'ENOENT')

    logger.error(prettify(e.message, e.name))

  }
  else if (e instanceof Error) {

    logger.error(prettify(e.message, e.name))

  }
  else if (typeof e === 'string') {

    logger.error(e)

  }

  process.exit(1)

})
