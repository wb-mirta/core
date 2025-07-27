import chalk from 'chalk'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { useLogger } from './utils/logger.js'

const msgPath = resolve('.git/COMMIT_EDITMSG')
const msg = readFileSync(msgPath, 'utf-8').trim()

const commitFormat
    = /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/

if (!commitFormat.test(msg)) {

  const { green, white } = chalk

  const logger = useLogger()

  logger.error(
    'Commit message format is incorrect\n'
    + white('Proper commit message format is required for automated changelog generation. Examples:\n\n')
    + green('    feat(store): add actions support\n')
    + green('    fix(event): do not call \'once\' twice (closes #10)\n\n')
    + white('See .github/commit-convention.md for more details')
  )

  process.exit(1)

}
