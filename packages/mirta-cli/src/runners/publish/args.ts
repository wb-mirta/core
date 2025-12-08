import { useLogger } from '#src/utils/logger'
import type { StagedArgs, OptionSchema } from '#src/utils/staged-args'

const logger = useLogger()

const options = ({
  'dry-run': {
    type: 'boolean',
    default: false,
  },
  'dry': {
    type: 'boolean',
    default: false,
  },
  'skip-build': {
    type: 'boolean',
    default: false,
  },
  'skip-git': {
    type: 'boolean',
    default: false,
  },
  'help': {
    type: 'boolean',
    short: 'h',
    default: false,
  },
  'version': {
    type: 'boolean',
    short: 'v',
    default: false,
  },
  // Deprecated. Use 'skip-git' instead
  'skipGit': {
    type: 'boolean',
    default: false,
  },
  // Deprecated. Use 'skip-build' instead
  'skipBuild': {
    type: 'boolean',
    default: false,
  },
}) satisfies OptionSchema

export function parseArgs(
  args: StagedArgs
) {

  const { values, positionals } = args.parseFinal(options)

  if (values.dry) {

    values['dry-run'] = values['dry-run'] || values.dry

  }

  if (values.skipGit) {

    logger.warn('Deprecated flag "--skipGit" used. Please use "--skip-git" instead.')
    values['skip-git'] = values['skip-git'] || values.skipGit

  }

  if (values.skipBuild) {

    logger.warn('Deprecated flag "--skipBuild" used. Please use "--skip-build" instead.')
    values['skip-build'] = values['skip-build'] || values.skipBuild

  }

  return {

    values,
    positionals,

  }

}
