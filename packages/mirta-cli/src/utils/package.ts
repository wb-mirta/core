import nodePath from 'node:path'
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs'

import { resolveMonorepoContextAsync } from '@mirta/workspace'
import { PackageError, readPackage, readPackageAsync, resolvePackagePath, type Package } from '@mirta/package'

import { THIS_PACKAGE_NAME } from '#src/constants'

import { runCommandAsync } from '#utils/shell'
import { getLocalized } from '#utils/localization'
import { useLogger } from '#utils/logger'

import chalk from 'chalk'
const { yellow } = chalk

const messages = await getLocalized()
const logger = useLogger(messages)

type DepType = 'dependencies' | 'devDependencies'

interface PackageDefinition {
  workspacePath: string
  isPrivate: boolean
}

interface MirtaConfig {
  scope?: string
  scopeAsPackagePrefix?: boolean
  templates?: string[]
}

const rootDir = process.cwd()

const context = await resolveMonorepoContextAsync(rootDir)

// Список всех пакетов репозитория.
const packages: Record<string, PackageDefinition> = {}

for (const pkg of context.packages) {

  // Необходимость обновления версии определяется
  // наличием атрибута версии.
  //
  // Не зависит от статуса private пакета.
  //
  if (pkg.version)
    packages[pkg.name] = {
      workspacePath: pkg.workspacePath,
      isPrivate: pkg.isPrivate,
    }

}

const templatePackages: Record<string, string[]> = {}

const rootPackage = await readPackageAsync(rootDir)

/** Возвращает текущую версию корневого проекта. */
export function getCurrentVersion() {

  if (!rootPackage.version)
    throw PackageError.getScoped(THIS_PACKAGE_NAME, 'noVersionField')

  return rootPackage.version

}

export function hasScript(name: string) {

  return rootPackage.scripts?.[name] !== void 0

}

const mirtaConfigFilePath = nodePath.join(rootDir, 'mirta.config.json')

if (existsSync(mirtaConfigFilePath)) {

  const config = JSON.parse(
    readFileSync(mirtaConfigFilePath, 'utf-8')
  ) as MirtaConfig

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

  return Boolean(pkgName && packages[pkgName])

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

    logger.step(`- ${dep}`)

  })

}

function updateTemplateDependencies(templateRoot: string, version: string) {

  logger.step(
    `Template: ${nodePath.relative(rootDir, templateRoot)}`
  )

  const pkgPath = resolvePackagePath(templateRoot)
  const pkg = readPackage(pkgPath)

  updateDependencies(pkg, 'dependencies', version)
  updateDependencies(pkg, 'devDependencies', version)

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

}

function updatePackageVersion(pkgRoot: string, version: string) {

  const pkgPath = resolvePackagePath(pkgRoot)
  const pkg = readPackage(pkgPath)

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

  // Обновляет корневой пакет.
  updatePackageVersion(
    rootDir,
    version
  )

  // Обновляет все остальные пакеты репозитория.
  for (const pkg of Object.values(packages)) {

    updatePackageVersion(
      nodePath.join(rootDir, pkg.workspacePath),
      version
    )

  }

  const templateKeys = Object.keys(templatePackages)

  // Обновляет пакеты, используемые в шаблонах.
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
  pkgPath: string,
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
        cwd: pkgPath,
        stdio: 'pipe',
      }
    )

    logger.success(`Published ${pkgName} ${version}`)

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

  for (const [pkgName, pkg] of Object.entries(packages)) {

    // Приватные пакеты не публикуются.
    if (pkg.isPrivate) {

      logger.step(`Skipping private ${pkgName}`)
      continue

    }

    await publishSinglePackageAsync(
      pkgName,
      nodePath.join(rootDir, pkg.workspacePath),
      version,
      flags
    )

  }

}
