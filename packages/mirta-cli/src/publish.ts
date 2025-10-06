import { parseArgs } from 'node:util'
import { getCurrentVersion, buildPackagesAsync, publishPackagesAsync } from '#utils/package'
import { helpMessage } from './message-help'

import cliPackage from '../package.json' with { type: 'json' }

const currentVersion = getCurrentVersion()

const allOptions = ({
  dry: {
    type: 'boolean',
    default: false,
  },
  skipGit: {
    type: 'boolean',
    default: false,
  },
  skipBuild: {
    type: 'boolean',
    default: false,
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false,
  },
  version: {
    type: 'boolean',
    short: 'v',
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

const skipGit = argv.skipGit
const isDryRun = argv.dry

await buildPackagesAsync(argv.skipBuild)
await publishPackagesAsync(currentVersion, skipGit, isDryRun)
