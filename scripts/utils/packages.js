import chalk from 'chalk'

import { basename, dirname, join, relative } from 'node:path'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'

import { useLogger } from './logger.js'
import { runCommandAsync } from './shell.js'

/**
 * @typedef {{
 *   name: string
 *   version: string
 *   dependencies?: { [packageName: string]: string }
 *   devDependencies?: { [packageName: string]: string }
 * }} Package
 */

const { yellow } = chalk
const logger = useLogger()

const rootDir = process.cwd()
const packagesDir = join(rootDir, 'packages')
const templatesDir = join(rootDir, 'packages', 'create-mirta', 'public', 'templates')

const getPackageRoot = packageName => join(packagesDir, packageName)

// Перечисляем пакеты, которые должны выйти в релиз.
const packages = readdirSync(packagesDir)
  .filter((pkgName) => {

    const pkgRoot = getPackageRoot(pkgName)

    if (!statSync(pkgRoot).isDirectory())
      return

    const pkg = JSON.parse(
      readFileSync(join(pkgRoot, 'package.json'), 'utf-8')
    )

    return !pkg.private

  })

// Ищет все возможные package.json среди шаблонов
const templatedPackages = readdirSync(templatesDir,
  {
    withFileTypes: true,
    recursive: true,
  })
  .reduce((items, nextEntry) => {

    if (nextEntry.name === 'package.json')
      items.push(nextEntry.parentPath)

    return items

  }, [])

/**
 * @param {string} pkgName
 */
const isCorePackage = (pkgName) => {

  if (!pkgName)
    return

  if (pkgName === 'create-mirta' || pkgName === 'mirta')
    return true

  return (
    pkgName.startsWith('@mirta')
    && packages.includes(pkgName.replace(/^@mirta\//, 'mirta-'))
  )

}

/**
 *
 * @param {Package} pkg
 * @param {'dependencies' | 'devDependencies'} depType
 * @param {string} version
 */
function updateDependencies(pkg, depType, version) {

  const deps = pkg[depType]

  if (!deps)
    return

  Object.keys(deps).forEach((dep) => {

    if (!isCorePackage(dep))
      return

    deps[dep] = version

  })

}

function updateTemplateDependencies(templateRoot, version) {

  logger.step(
    `Template '${relative(templatesDir, templateRoot)}'`
  )

  const pkgPath = join(templateRoot, 'package.json')

  /** @type {Package} */
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  updateDependencies(pkg, 'dependencies', version)
  updateDependencies(pkg, 'devDependencies', version)

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

}

/**
 * @param {string} pkgRoot
 * @param {string} version
 */
function updatePackageVersion(pkgRoot, version) {

  const pkgPath = join(pkgRoot, 'package.json')

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  logger.step(
    pkgRoot === rootDir
      ? 'Root package'
      : `Package ${pkg.name ?? basename(dirname(pkgPath))}`
  )

  pkg.version = version

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

}

/**
 * @param {string} version
 */
export function updateVersion(version) {

  logger.log(`Patching all packages to version ${version}`)

  // Update root package.json
  updatePackageVersion(rootDir, version)

  // Update all packages
  packages.forEach(pkgDirName =>
    updatePackageVersion(
      join(packagesDir, pkgDirName),
      version
    )
  )

  logger.log(`Patching templated packages`)

  templatedPackages.forEach(pkgDirName =>
    updateTemplateDependencies(pkgDirName, version)
  )

}

/**
 * @param {boolean} skipBuild
 */
export async function buildPackagesAsync(skipBuild) {

  if (!skipBuild) {

    logger.log('\nBuilding packages...')
    await runCommandAsync('pnpm', ['run', 'build'])

  }
  else {

    logger.log(`\n${yellow('Skip')} building packages`)

  }

}

/**
 *
 * @param {string} pkgName
 * @param {string} version
 * @param {string[]} flags
 */
async function publishSinglePackageAsync(pkgName, version, flags) {

  /** @type {string|undefined} */
  let releasTag = void 0

  if (version.includes('alpha')) {

    releasTag = 'alpha'

  }
  else if (version.includes('beta')) {

    releasTag = 'beta'

  }
  else if (version.includes('rc')) {

    releasTag = 'rc'

  }

  logger.step(`Publishing ${pkgName}`)

  try {

    await runCommandAsync(
      'pnpm',
      [
        'publish',
        ...(releasTag ? ['--tag', releasTag] : []),
        '--access',
        'public',
        ...(flags),
      ],
      {
        cwd: getPackageRoot(pkgName),
        stdio: 'pipe',
      }
    )

    logger.success(`Published ${pkgName}@${version}`)

  }
  catch (e) {

    if (e.message?.match(/previously published/)) {

      logger.warn(`Skipping already published ${pkgName}`)

    }
    else {

      throw e

    }

  }

}

/**
 * @param {string} version
 * @param {boolean} skipGitChecks
 * @param {boolean} isDryRun
 */
export async function publishPackagesAsync(version, skipGitChecks, isDryRun) {

  logger.log('\nPublishing packages...')

  /** @type {string[]} */
  const flags = []

  if (isDryRun)
    flags.push('--dry-run')

  if (isDryRun || skipGitChecks || process.env.CI)
    flags.push('--no-git-checks')

  if (process.env.CI)
    flags.push('--provenance')

  for (const pkgName of packages) {

    await publishSinglePackageAsync(pkgName, version, flags)

  }

}
