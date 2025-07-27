import chalk from 'chalk'
import semver from 'semver'
import { createRequire } from 'node:module'
import { parseArgs } from 'node:util'
import { prompts, PromptCanceledError } from './utils/prompts.js'
import { useLogger } from './utils/logger.js'
import { runCommandAsync, ShellError } from './utils/shell.js'
import { ensureIsSyncedWithRemoteAsync, getWorkflowResultAsync, GithubError, WorkflowStatusError } from './utils/github.js'
import { updateVersion, buildPackagesAsync, publishPackagesAsync } from './utils/packages.js'

const githubProject = 'wb-mirta/core'

let isVersionUpdated = false

const { yellow } = chalk
const logger = useLogger()

const currentVersion = createRequire(import.meta.url)('../package.json').version

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    dry: {
      type: 'boolean',
    },
    preid: {
      type: 'string',
    },
    publishOnly: {
      type: 'boolean',
    },
    skipPrompts: {
      type: 'boolean',
    },
    skipGit: {
      type: 'boolean',
    },
    skipBuild: {
      type: 'boolean',
    },
  },
})

// Идентификатор предрелиза - alpha, beta, rc и т.п.
const preId = args.preid || semver.prerelease(currentVersion)?.[0]

const skipGit = args.skipGit
const skipPrompts = args.skipPrompts
const isDryRun = args.dry

const runCommandIfNotDryAsync = runCommandAsync.ifNotDry(isDryRun)

// Возможные типы релиза.
//
/** @type {ReadonlyArray<import('semver').ReleaseType>} */
const releaseTypes = [
  'patch',
  'minor',
  'major',
  ...(preId
    ? /** @type {const} */ (['prepatch', 'preminor', 'premajor', 'prerelease'])
    : []
  ),
]

// Параметр командной строки:
// конкретный номер версии, либо тип релиза (см. releaseTypes).
//
let targetVersion = positionals[0]

const getIncremented = (/** @type {import('semver').ReleaseType} */ release) =>
  semver.inc(
    currentVersion,
    release,
    typeof preId === 'string' ? preId : void 0
  )

// Основной алгоритм, запускается вручную из командной строки.
//
async function releaseAsync() {

  await ensureIsSyncedWithRemoteAsync()

  // Если версия не указана, предоставить возможность выбора.
  if (!targetVersion) {

    const choices = releaseTypes
      .map(item => `${item} (${getIncremented(item)})`)
      .concat(['custom'])

    /** @type {{ release: string }} */
    const { release } = await prompts({
      type: 'select',
      name: 'release',
      message: 'Select release type',
      choices,
      format: index => choices[index],
    })

    if (release === 'custom') {

      const { version } = await prompts({
        type: 'text',
        name: 'version',
        message: 'Type custom version',
        initial: currentVersion,
      })

      // Номер версии вводится вручную.
      targetVersion = version

    }
    else {

      // Номер версии извлекается из предложенной ранее строки.
      targetVersion = release.match(/\((.*)\)/)?.[1] ?? ''

    }

  }

  // Вместо номера версии передан компонент для инкремента?
  if (releaseTypes.includes(targetVersion)) {

    targetVersion = getIncremented(targetVersion)

  }

  // Если введённое значение не является действительным
  // номером версии, прервать выполнение.
  if (!semver.valid(targetVersion)) {

    throw new Error(`Incorrect target version: ${targetVersion}`)

  }

  if (skipPrompts) {

    logger.info(`Releasing v${targetVersion}`)

  }
  else {

    /** @type {{ confirmRelease: boolean }} */
    const { confirmRelease } = await prompts({
      type: 'confirm',
      name: 'confirmRelease',
      message: `Releasing v${targetVersion}. Continue?`,
    })

    if (!confirmRelease) {

      logger.cancel('No changes was made.')

      return

    }

  }

  logger.log('Ensuring CI status for HEAD...')

  const isBuildPassed = await getWorkflowResultAsync('Build')

  if (!isBuildPassed)
    throw new WorkflowStatusError('CI build of the latest commit has not passed yet.')

  updateVersion(targetVersion)
  isVersionUpdated = true

  logger.log('Generating changelog...')
  await runCommandAsync('pnpm', ['run', 'changelog'])

  if (!skipPrompts) {

    /** @type {{ isContinue: boolean }} */
    const { isContinue } = await prompts({
      type: 'confirm',
      name: 'isContinue',
      message: 'Changelog generated. Does it look good?',
    })

    if (!isContinue)
      return

  }

  logger.log('Updating lock-file...')
  await runCommandAsync('pnpm', ['install', '--prefer-offline'])

  if (!skipGit) {

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
        + `\nCheck status at https://github.com/${githubProject}/actions/workflows/release.yml`
      )

    }
    else {

      logger.info('No changes to commit.')

    }

  }

}

async function publishOnlyAsync() {

  await buildPackagesAsync(args.skipBuild)
  await publishPackagesAsync(currentVersion, skipGit, isDryRun)

}

const runAsync = (
  args.publishOnly
    ? publishOnlyAsync
    : releaseAsync
)

runAsync().catch((e) => {

  if (e instanceof GithubError || e instanceof WorkflowStatusError || e instanceof ShellError) {

    logger.error(e.message.replace(new RegExp(`^${e.name}:`), ''), e.name)

  }
  else if (e instanceof PromptCanceledError) {

    logger.cancel('Operation canceled')

  }
  else {

    logger.error(e)

  }

  if (isVersionUpdated) {

    // Revert version changes on failed release
    updateVersion(currentVersion)

  }

  process.exit(1)

})
