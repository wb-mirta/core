import { useLogger } from '#src/utils/logger'
import type { OptionSchema, StagedArgs } from '#src/utils/staged-args'

const logger = useLogger()

const options = ({
  'dry-run': { type: 'boolean' },
  'dry': { type: 'boolean' },
  'preid': { type: 'string' },
  'skip-prompts': { type: 'boolean' },
  'skip-git': { type: 'boolean' },
  'help': { type: 'boolean' },
  'version': { type: 'boolean' },
  // Deprecated. Use 'skip-git' instead
  'skipGit': { type: 'boolean' },
  // Deprecated. Use 'skip-prompts' instead
  'skipPrompts': { type: 'boolean' },
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

  if (values.skipPrompts) {

    logger.warn('Deprecated flag "--skipPrompts" used. Please use "--skip-prompts" instead.')
    values['skip-prompts'] = values['skip-prompts'] || values.skipPrompts

  }

  return {

    values,
    positionals,

  }

}
