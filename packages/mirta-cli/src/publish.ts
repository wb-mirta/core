import { parseArgs } from 'node:util'
import { getCurrentVersion, buildPackagesAsync, publishPackagesAsync } from '#utils/package'
import { helpMessage } from './message-help'

import cliPackage from '../package.json' with { type: 'json' }

import { getLocalized } from './utils/localization'
import { useLogger } from './utils/logger'

const messages = await getLocalized()
const logger = useLogger(messages)

const currentVersion = getCurrentVersion()

const allOptions = ({
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
}) as const

const args = process.argv.slice(2)

const { values: argv } = parseArgs({
  args,
  options: allOptions,
  allowPositionals: true,
})

if (argv.help) {

  console.log(helpMessage)
  process.exit(0)

}

if (argv.version) {

  console.log(`${cliPackage.name} v${cliPackage.version}`)
  process.exit(0)

}

const isDryRun = argv['dry-run'] || argv.dry

const skipBuild = argv['skip-build'] || argv.skipBuild

if (argv.skipBuild)
  logger.warn('Deprecated flag "--skipBuild" used. Please use "--skip-build" instead.')

const skipGit = argv['skip-git'] || argv.skipGit

if (argv.skipGit)
  logger.warn('Deprecated flag "--skipGit" used. Please use "--skip-git" instead.')

await buildPackagesAsync(skipBuild)
await publishPackagesAsync(currentVersion, skipGit, isDryRun)
