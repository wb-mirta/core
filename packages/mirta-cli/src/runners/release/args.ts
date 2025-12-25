import { logger } from '#src/utils/logger'
import type { OptionSchema, StagedArgs } from '#src/staged-args'

const options = ({
  'config': {
    type: 'string',
    short: 'c',
  },
  'dry-run': {
    type: 'boolean',
  },
  'preid': {
    type: 'string',
  },
  'skip-git': {
    type: 'boolean',
  },
  'skip-prompts': {
    type: 'boolean',
  },
  // Deprecated. Use 'skip-git' instead
  'skipGit': {
    type: 'boolean',
  },
  // Deprecated. Use 'skip-prompts' instead
  'skipPrompts': {
    type: 'boolean',
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

  if (values.skipGit) {

    logger.warn('Deprecated flag "--skipGit" used. Please use "--skip-git" instead')
    values['skip-git'] = values['skip-git'] !== false

  }

  if (values.skipPrompts) {

    logger.warn('Deprecated flag "--skipPrompts" used. Please use "--skip-prompts" instead')
    values['skip-prompts'] = values['skip-prompts'] !== false

  }

  return {

    values,
    positionals,

  }

}
