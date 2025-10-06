import nodePath from 'node:path'
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs'

import { runCommandAsync } from '#utils/shell'
import { getLocalized } from '#utils/localization'
import { useLogger } from '#utils/logger'

import chalk from 'chalk'
const { yellow } = chalk

const messages = await getLocalized()
const logger = useLogger(messages)

type DepType = 'dependencies' | 'devDependencies'

interface MirtaConfig {
  scope?: string
  scopedPackagePrefix?: boolean
  templates?: string[]
}

interface Package {
  name?: string
  version: string
  private: boolean
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const rootDir = process.cwd()
const packagesDir = nodePath.join(rootDir, 'packages')

const getPackageRoot
  = (packageName: string) => nodePath.join(packagesDir, packageName)

// Перечисляем пакеты, которые должны выйти в релиз.
const packages = readdirSync(packagesDir)
  .filter((pkgName) => {

    const pkgRoot = getPackageRoot(pkgName)

    if (!statSync(pkgRoot).isDirectory())
      return

    const pkg = JSON.parse(
      readFileSync(nodePath.join(pkgRoot, 'package.json'), 'utf-8')
    ) as Package

    return !pkg.private

  })

const templatePackages: Record<string, string[]> = {}

/** Имя пользователя или организации, владеющей пакетом. */
let scope: string | undefined
/** Форматированный scope пакета. */
let scoped: string | undefined
/** Использовать scope в качестве префикса в названиях пакетов. */
let scopeAsPackagePrefix = false

const mirtaConfigFilePath = nodePath.join(rootDir, 'mirta.config.json')

const rootPackage = JSON.parse(
  readFileSync(nodePath.join(rootDir, 'package.json'), 'utf-8')
) as Package

if (rootPackage.name) {

  const match = /^@([^/]+)\//i.exec(rootPackage.name)

  if (match?.[1]) {

    scope = match[1]
    scoped = `@${match[1]}/`

  }

}

/** Возвращает текущую версию корневого проекта. */
export function getCurrentVersion() {

  return rootPackage.version

}

export function hasScript(name: string) {

  return rootPackage.scripts?.[name] !== void 0

}

if (existsSync(mirtaConfigFilePath)) {

  const config = JSON.parse(
    readFileSync(mirtaConfigFilePath, 'utf-8')
  ) as MirtaConfig

  scope = config.scope
  scopeAsPackagePrefix = config.scopedPackagePrefix === true

  if (scope?.startsWith('@'))
    scope = scope.slice(1)

  if (scope)
    scoped = `@${scope}/`

  if (config.templates && Array.isArray(config.templates)) {

    config.templates.forEach((template) => {

      const templatesDir = nodePath.resolve(rootDir, template)

      // Предохранитель от выхода за пределы рабочей директории.
      if (!templatesDir.startsWith(rootDir))
        return

      // Обрабатываем только существующие директории.
      if (!statSync(templatesDir).isDirectory())
        return

      const localTemplatePackages = readdirSync(templatesDir,
        {
          withFileTypes: true,
          recursive: true,
        })
        .reduce<string[]>((items, nextEntry) => {

          if (nextEntry.name === 'package.json')
            items.push(nextEntry.parentPath)

          return items

        }, [])

      templatePackages[templatesDir] = localTemplatePackages

    })

  }

}

const isWorkspacePackage = (pkgName: string) => {

  if (!pkgName)
    return false

  if (packages.includes(pkgName))
    return true

  if (!scoped || !pkgName.startsWith(scoped))
    return false

  pkgName = pkgName.slice(scoped.length)

  if (scopeAsPackagePrefix)
    pkgName = `${scope}-${pkgName}`

  return packages.includes(pkgName)

}

function updateDependencies(
  pkg: Package,
  depType: DepType,
  version: string
) {

  const deps = pkg[depType]

  if (!deps)
    return

  Object.keys(deps).forEach((dep) => {

    if (!isWorkspacePackage(dep))
      return

    deps[dep] = version

  })

}

function updateTemplateDependencies(templateRoot: string, version: string) {

  logger.step(
    `Template: ${nodePath.relative(rootDir, templateRoot)}`
  )

  const pkgPath = nodePath.join(templateRoot, 'package.json')

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Package

  updateDependencies(pkg, 'dependencies', version)
  updateDependencies(pkg, 'devDependencies', version)

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

}

function updatePackageVersion(pkgRoot: string, version: string) {

  const pkgPath = nodePath.join(pkgRoot, 'package.json')

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Package

  logger.step(
    pkgRoot === rootDir
      ? 'Root package'
      : `Package: ${pkg.name ?? nodePath.basename(pkgRoot)}`
  )

  pkg.version = version

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

}

export function updateVersion(version: string) {

  logger.log(`Patching all packages to version ${version}`)

  // Update root package.json
  updatePackageVersion(rootDir, version)

  // Update all packages
  packages.forEach((pkgDirName) => {

    updatePackageVersion(
      nodePath.join(packagesDir, pkgDirName),
      version
    )

  })

  const templateKeys = Object.keys(templatePackages)

  if (templateKeys.length > 0) {

    logger.log(`Patching template packages`)

    Object.keys(templatePackages).forEach((templatesDir) => {

      templatePackages[templatesDir].forEach((templateRoot) => {

        updateTemplateDependencies(templateRoot, version)

      })

    })

  }

}

/** Выполняет сборку пакетов стандартной командой `pnpm run build`. */
export async function buildPackagesAsync(skipBuild: boolean) {

  if (!skipBuild) {

    logger.log('Building packages...')
    await runCommandAsync('pnpm', ['run', 'build'])

  }
  else {

    logger.log(`${yellow('Skip')} building packages`)

  }

}

async function publishSinglePackageAsync(
  pkgName: string,
  version: string,
  flags: string[]
) {

  let releaseTag: string | undefined = void 0

  if (version.includes('alpha')) {

    releaseTag = 'alpha'

  }
  else if (version.includes('beta')) {

    releaseTag = 'beta'

  }
  else if (version.includes('rc')) {

    releaseTag = 'rc'

  }

  logger.step(`Publishing ${pkgName}`)

  try {

    await runCommandAsync(
      'pnpm',
      [
        'publish',
        ...(releaseTag ? ['--tag', releaseTag] : []),
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
  catch (e: unknown) {

    if (e instanceof Error && /previously published/.exec(e.message)) {

      logger.warn(`Skipping already published ${pkgName}`)

    }
    else {

      throw e

    }

  }

}

/** Выполняет публикацию пакетов монорепозитория в NPM. */
export async function publishPackagesAsync(
  version: string,
  skipGitChecks: boolean,
  isDryRun: boolean
) {

  logger.log('Publishing packages...')

  const flags: string[] = []

  if (isDryRun)
    flags.push('--dry-run')

  if (isDryRun || skipGitChecks || process.env.CI)
    flags.push('--no-git-checks')

  if (process.env.CI)
    flags.push('--provenance')

  for (const pkgName of packages)
    await publishSinglePackageAsync(pkgName, version, flags)

}
