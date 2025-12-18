import type { StagedArgs, OptionSchema } from '#src/staged-args'
import { useLogger } from '#src/utils/logger'

const logger = useLogger()

const options = ({
  'config': {
    type: 'string',
    short: 'c',
  },
  'dry-run': {
    type: 'boolean',
  },
  'profile': {
    type: 'string',
    short: 'p',
  },
  'to': {
    type: 'string',
  },
  // Deprecated. Use 'dry-run' instead
  'dry': {
    type: 'boolean',
  },
}) satisfies OptionSchema

export function parseArgs(
  args: StagedArgs
) {

  const { values, positionals } = args.parseFinal(options)

  if (values.dry) {

    logger.warn('Deprecated flag "--dry" used. Please use "--dry-run" instead')
    values['dry-run'] = values['dry-run'] !== false

  }

  return {

    values,
    positionals,

  }

}
