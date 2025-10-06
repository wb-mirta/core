import { parseArgs } from 'node:util'
import { prerelease, inc, valid, type ReleaseType } from 'semver'
import { helpMessage } from './message-help'
import {
  checkIsInWorkTreeAsync,
  ensureIsSyncedWithRemoteAsync,
  ensureWorkflowResultAsync,
  getRepositoryDetails,
  type ConnectionType
} from '#utils/github'
import { prompts } from '#utils/prompts'
import { runCommandAsync } from '#utils/shell'
import { getLocalized } from '#utils/localization'
import { useLogger } from '#utils/logger'
import { getCurrentVersion, hasScript, updateVersion } from '#utils/package'
import chalk from 'chalk'

import cliPackage from '../package.json' with { type: 'json' }

const { yellow } = chalk

const allOptions = ({
  dry: {
    type: 'boolean',
    default: false,
  },
  preid: {
    type: 'string',
  },
  skipPrompts: {
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

const { values: argv, positionals } = parseArgs({
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

const messages = await getLocalized()
const logger = useLogger(messages)

const currentVersion = getCurrentVersion()
const preid = argv.preid ?? prerelease(currentVersion)?.[0] as string | undefined

/** Возможные типы релиза. */
const releaseTypes: readonly ReleaseType[] = [
  'patch',
  'minor',
  'major',
  ...(preid
    ? (['prepatch', 'preminor', 'premajor', 'prerelease']) as const
    : [] as const
  ),
] as const

const isDryRun = argv.dry
const skipGit = argv.skipGit
const skipPrompts = argv.skipPrompts

// Параметр командной строки:
// конкретный номер версии, либо тип релиза (см. releaseTypes).
//
let targetVersion = positionals[1]

const getIncremented = (release: ReleaseType) =>
  inc(
    currentVersion,
    release,
    void 0,
    preid
  )

const inWorkTree = await checkIsInWorkTreeAsync()

let repository: string
let connectionType: ConnectionType | undefined

if (inWorkTree) {

  const { name: repoName, connectionType: connType } = await getRepositoryDetails()

  // Репозиторий, в котором выполняется релиз.
  repository = repoName
  // Тип подключения к удалённому репозиторию.
  connectionType = connType

  if (repository)
    logger.info(`Repository: ${repository}`)

  await ensureIsSyncedWithRemoteAsync(repository)

}
else {

  logger.info('Repository: not in git work tree')

}

// Если версия не указана, предоставить возможность выбора.
if (!targetVersion) {

  const choices = releaseTypes
    .map((item) => {

      const version = getIncremented(item)

      return { title: `${item} (${version})`, value: version }

    })
    .concat([{ title: 'custom', value: 'custom' }])

  const { release } = await prompts({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices,
  })

  if (release === 'custom') {

    const { version } = await prompts({
      type: 'text',
      name: 'version',
      message: 'Type custom version',
      initial: currentVersion,
    })

    // Номер версии вводится вручную.
    targetVersion = version as string

  }
  else {

    // Номер версии извлекается из предложенной ранее строки.
    targetVersion = release as string

  }

}

// Вместо номера версии передан компонент для инкремента?
//
if (releaseTypes.includes(targetVersion as ReleaseType))
  targetVersion = getIncremented(targetVersion as ReleaseType) ?? ''

if (!valid(targetVersion))
  throw new Error(`Target version is not valid: ${targetVersion}`)

const runCommandIfNotDryAsync = runCommandAsync.ifNotDry(isDryRun)

let isVersionUpdated = false

async function runAsync() {

  if (skipPrompts) {

    logger.info(`Releasing v${targetVersion}`)

  }
  else {

    const { confirmRelease } = await prompts({
      type: 'confirm',
      name: 'confirmRelease',
      message: `Releasing v${targetVersion}. Continue?`,
    })

    if (!confirmRelease) {

      logger.cancel(
        'No changes was made.'
      )

      return

    }

  }

  if (inWorkTree) {

    logger.log('Ensuring CI status for HEAD...')
    await ensureWorkflowResultAsync(repository, 'build')

  }

  updateVersion(targetVersion)
  isVersionUpdated = true

  if (inWorkTree && hasScript('changelog')) {

    logger.log('Generating changelog...')
    await runCommandAsync('pnpm', ['run', 'changelog'])

    if (!skipPrompts) {

      const { isContinue } = await prompts({
        type: 'confirm',
        name: 'isContinue',
        message: 'Changelog generated. Does it look good?',
      })

      if (!isContinue)
        return

    }

  }

  logger.log('Updating lock-file...')
  await runCommandAsync('pnpm', ['install', '--prefer-offline'])

  if (!skipGit && connectionType === 'ssh') {

    const { stdout } = await runCommandAsync('git', ['diff'], { stdio: 'pipe' })

    if (stdout) {

      logger.step('Committing version changes...')

      await runCommandIfNotDryAsync('git', ['add', '-A'])
      await runCommandIfNotDryAsync('git', ['commit', '-m', `release: v${targetVersion}`])

      logger.step('Pushing to GitHub')

      await runCommandIfNotDryAsync('git', ['tag', `v${targetVersion}`])
      await runCommandIfNotDryAsync('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
      await runCommandIfNotDryAsync('git', ['push'])

      logger.note(
        yellow('Release will be done via GitHub Actions.')
        + `\nCheck status at https://github.com/${repository}/actions/workflows/release.yml`
      )

    }
    else {

      logger.info('No changes to commit.')

    }

  }

}

await runAsync().catch((e: unknown) => {

  if (isVersionUpdated) {

    // Revert version changes on failed release
    updateVersion(currentVersion)

  }

  throw e

})
