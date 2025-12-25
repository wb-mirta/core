import { PromptCanceledError } from '#utils/prompts'
import { createStagedArgs } from '#src/staged-args'
import { OperationCanceledError, ShellError } from '#utils/shell'
import { GitError, GithubError, WorkflowStatusError } from './utils/github'
import { getHelpMessage } from './message-help'

import cliPackage from '../package.json' with { type: 'json' }
import { setLocaleAsync, t } from './i18n'
import { resolveRunnerAsync } from './runners'

import { logger } from '#utils/logger'

const commonOptions = {

  locale: {
    type: 'string',
  },
  version: {
    type: 'boolean',
    short: 'v',
  },
  help: {
    type: 'boolean',
    short: 'h',
  },

} as const

async function run() {

  const args = createStagedArgs(
    process.argv.slice(2)
  )

  const { values: argv, positionals, stagedArgs: runnerArgs } = args.parse(commonOptions)

  if (argv.locale)
    await setLocaleAsync(argv.locale)

  if (argv.version) {

    console.log(`${cliPackage.name} v${cliPackage.version}`)
    return

  }

  if (argv.help || !positionals.length) {

    console.log(getHelpMessage())
    return

  }

  const module = await resolveRunnerAsync(positionals[0])

  await module.runAsync(runnerArgs)

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
  else if (e instanceof PromptCanceledError || e instanceof OperationCanceledError) {

    logger.cancel(t('step.canceled'))

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
