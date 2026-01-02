import cliPackage from '../package.json' with { type: 'json' }

import { createStagedArgs } from '@mirta/staged-args'
import { assertNoParseErrors } from '#assertions'
import { setLocaleAsync, t } from '#i18n'
import { logger } from '#utils/logger'
import { OperationCanceledError, PromptCanceledError } from '#errors'
import { resolveRunnerAsync } from '#runners'
import { banner } from '#banner'
import { getFinalMessage } from '#message-final'
import { getHelpMessage } from '#message-help'
import { pickProjectAsync } from '#project/picker'
import { resolveProjectContextAsync } from '#project-context/resolver'

const initialSchema = ({

  // === Common options ===

  version: {
    type: 'boolean',
    short: 'v',
  },
  help: {
    type: 'boolean',
    short: 'h',
  },
  locale: {
    type: 'string',
  },
  template: {
    type: 'string',
  },
  force: {
    type: 'boolean',
  },
  bare: {
    type: 'boolean',
  },

}) as const

async function run() {

  const args = createStagedArgs(
    process.argv.slice(2)
  )

  const parseResult = args.parse(initialSchema)
  assertNoParseErrors(parseResult)

  const { values: argv, positionals, stagedArgs: runnerArgs } = parseResult.data

  if (argv.locale)
    await setLocaleAsync(argv.locale)

  if (argv.version) {

    console.log(`${cliPackage.name} v${cliPackage.version}`)
    return

  }

  if (argv.help) {

    console.log(getHelpMessage())
    return

  }

  console.log(banner)
  console.log(t('title'))
  console.log()

  // Определяем тип шаблона - по аргументам или через вопрос пользователю.
  const selection = await pickProjectAsync(argv.template)

  const runner = await resolveRunnerAsync(selection.type)

  const context = await resolveProjectContextAsync(selection, {
    projectFolder: positionals[0],
    forceOverwrite: argv.force,
    barebone: argv.bare,
  })

  await runner.runAsync(runnerArgs, context)

  console.log()
  console.log(getFinalMessage())

}

function prettify(message: string, name?: string) {

  if (name && message.startsWith(name))
    return message.slice(name.length)

  return message

}

run().catch((e: unknown) => {

  if (e instanceof PromptCanceledError || e instanceof OperationCanceledError) {

    logger.cancel(t('step.canceled'))

  }
  else if (e instanceof Error) {

    logger.error(prettify(e.message, e.name))

  }
  else if (typeof e === 'string') {

    logger.error(e)

  }

  process.exit(1)

})
