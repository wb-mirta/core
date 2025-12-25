import { logger } from '#utils/logger'
import type { StagedArgs, OptionSchema } from '#src/staged-args'

const options = ({
  'dry-run': {
    type: 'boolean',
  },
  'skip-git': {
    type: 'boolean',
  },
  'skip-build': {
    type: 'boolean',
  },
  // Deprecated. Use 'dry-run' instead
  'dry': {
    type: 'boolean',
  },
  // Deprecated. Use 'skip-git' instead
  'skipGit': {
    type: 'boolean',
  },
  // Deprecated. Use 'skip-build' instead
  'skipBuild': {
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

  if (values.skipGit) {

    logger.warn('Deprecated flag "--skipGit" used. Please use "--skip-git" instead')
    values['skip-git'] = values['skip-git'] !== false

  }

  if (values.skipBuild) {

    logger.warn('Deprecated flag "--skipBuild" used. Please use "--skip-build" instead')
    values['skip-build'] = values['skip-build'] !== false

  }

  return {

    values,
    positionals,

  }

}
