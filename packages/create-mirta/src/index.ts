import { fileURLToPath } from 'node:url'
import { resolve, basename } from 'node:path'
import { parseArgs } from 'node:util'
import { canSkipDir, emptyDir } from './utils/file-system'
import { intro, confirm, text, multiselect, select, outro } from '@clack/prompts'
import { usePrompts } from './utils/prompts'
import { banner } from './banner'
import { helpMessage } from './message-help'
import fs from 'node:fs'
import cliPackage from '../package.json' with { type: 'json' }
import chalk from 'chalk'

import { type CliScope } from './types'
import { featureFlags, allOptions } from './cli-options'
import { getLocalized } from './utils/localization'

import renderTemplate from './utils/render-template'
import renderEslintConfig from './utils/render-eslint-config'
import { installDependencies, runningPackageManager } from './utils/manager'
import { formatSuccess } from './utils/logger'
import { finalMessage } from './message-final'

const { dim, red, yellow } = chalk

const templatesPath = './templates'

const messages = await getLocalized()

type FeatureKey = keyof typeof featureFlags

interface FeatureOption {
  value: FeatureKey
  label: string
  hint?: string
}

const featureOptions: FeatureOption[] = [
  {
    value: 'eslint',
    label: messages.addEslint.message,
    hint: messages.addEslint.hint,
  },
  {
    value: 'store',
    label: messages.addStore.message,
    hint: messages.addStore.hint,
  },
  {
    value: 'vitest',
    label: messages.addVitest.message,
    hint: messages.addVitest.hint,
  },
]

const { prompt, cancel, step, inlineSub } = usePrompts(messages)

function isValidPackageName(packageName: string) {

  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
    .test(packageName)

}

function toValidPackageName(packageName: string) {

  return packageName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]+/, '')
    .replace(/[^a-z0-9-~]+/g, '-')

}

async function run() {

  const cwd = process.cwd()
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

  // Если какой-либо функционал указан заранее, пропустить этот вопрос.
  const isFeatureFlagsUsed = Object.keys(featureFlags)
    .some(flag => typeof argv[flag] === 'boolean')

  let targetDir = positionals[0]

  const hasPositionalDir = targetDir && targetDir !== '.'
  const defaultProjectName = hasPositionalDir ? targetDir : 'wb-rules-mirta'

  const shouldOverwrite = argv.force

  const scope: CliScope = {
    projectName: defaultProjectName,
    projectRoot: '',
    packageName: defaultProjectName,
    shouldOverwrite,
    features: [],
  }

  console.log(banner)
  console.log(messages.title)
  console.log()

  intro(chalk.bgYellow.black(` ${messages.intro} `))

  if (!targetDir) {

    const answer = await prompt(
      text({
        message: messages.projectName.message,
        placeholder: defaultProjectName,
        defaultValue: defaultProjectName,
        validate: (value) => {

          if (value.length !== 0 && value.trim().length === 0)
            return messages.validation.required

        },
      })
    )

    targetDir = scope.projectName = scope.packageName = answer.trim()

  }

  const root = scope.projectRoot = resolve(cwd, targetDir)
  const baseName = basename(root)

  if (hasPositionalDir) {

    step(`${messages.projectName.message}\n${dim(baseName)}`)

  }

  // Защита от выхода за пределы рабочей директории.
  if (!root.startsWith(cwd)) {

    cancel(messages.errors.rootIsNotRelative)
    process.exit(1)

  }

  if (!isValidPackageName(targetDir)) {

    scope.packageName = await prompt(
      text({
        message: messages.packageName.message,
        initialValue: toValidPackageName(baseName),
        validate: value =>
          isValidPackageName(value)
            ? undefined
            : messages.packageName.errorMessage,
      })
    )

  }

  if (!canSkipDir(targetDir) && !shouldOverwrite) {

    scope.shouldOverwrite = await prompt(
      confirm({
        message: `${
          targetDir === '.'
            ? messages.shouldOverwrite.directory.current
            : messages.shouldOverwrite.directory.target
        } "${baseName}" ${messages.shouldOverwrite.message} ${red(messages.shouldOverwrite.confirmDelete)}`,
        initialValue: false,
      })
    )

    if (!scope.shouldOverwrite) {

      cancel()
      process.exit(0)

    }

  }

  if (!isFeatureFlagsUsed) {

    scope.features = await prompt(
      multiselect({
        message: `${messages.featureSelection.message}${inlineSub(dim(messages.featureSelection.hint))}`,
        options: featureOptions,
        required: false,
      })
    )

  }

  const { features } = scope

  const addEslint = argv.eslint === true || features.includes('eslint')
  const addStore = argv.store === true || features.includes('store')
  const addVitest = argv.vitest === true || features.includes('vitest')

  // Очистка целевой директории
  if (fs.existsSync(root)) {

    if (scope.shouldOverwrite)
      emptyDir(root)

  }
  else {

    fs.mkdirSync(root)

  }

  step(`${messages.status.scaffolding} ${yellow(root)}`)

  const pkg = { name: scope.packageName, version: '0.0.0' }

  fs.writeFileSync(
    resolve(root, 'package.json'),
    JSON.stringify(pkg, null, 2)
  )

  const templateRoot = fileURLToPath(new URL(templatesPath, import.meta.url))

  const render = function (templateName: string) {

    const templateDir = resolve(templateRoot, templateName)
    renderTemplate(templateDir, root)

  }

  // Create basic project structure
  render('base')

  // Add TypeScript support
  render('config/typescript')

  if (addEslint) {

    renderEslintConfig(templateRoot, root, {
      addVitest,
    })

    render('config/eslint')

  }

  if (!argv.bare) {

    render('example/base')

  }

  if (addStore) {

    render('config/store')

    if (!argv.bare) {

      render('example/store')

    }

  }

  if (addVitest) {

    render('config/vitest')

    if (!argv.bare) {

      render('example/vitest/base')

      if (addStore) {

        render('example/vitest/store')

      }

    }

  }

  step(formatSuccess(
    messages.status.scaffolded,
    messages.status.success
  ))

  scope.packageManager ??= await prompt(
    select({
      message: `${messages.dependencies.question} ${dim(messages.accent.recommended)}`,
      options: runningPackageManager
        ? [
            {
              value: runningPackageManager.name,
              label: `${messages.dependencies.current.message} ${runningPackageManager.name}`,
            },
            {
              value: '',
              label: messages.dependencies.no.message,
            },
          ]
        : [
            {
              value: 'pnpm',
              label: messages.dependencies.pnpm.message,
              hint: messages.dependencies.pnpm.hint,
            },
            {
              value: 'yarn',
              label: messages.dependencies.yarn.message,
            },
            {
              value: 'npm',
              label: messages.dependencies.npm.message,
            },
            {
              value: 'bun',
              label: messages.dependencies.bun.message,
            },
            {
              value: '',
              label: messages.dependencies.no.message,
            },
          ],
    })
  )

  if (scope.packageManager) {

    outro(messages.status.installingDependencies)

    await installDependencies(scope)

  }

  console.log()
  console.log(finalMessage)

}

run().catch((e: unknown) => {

  console.error(e)
  process.exit(1)

})
