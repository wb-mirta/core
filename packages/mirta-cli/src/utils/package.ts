import nodePath, { posix } from 'node:path'

import { readFileSync, existsSync, writeFileSync } from 'node:fs'

import { glob } from 'node:fs/promises'

import { resolveMonorepoContextAsync, type PackageDefinition } from '@mirta/workspace'
import { PackageError, readPackage, readPackageAsync, resolvePackagePath, toPosix, type Package } from '@mirta/package'

import { THIS_PACKAGE_NAME } from '#src/constants'

import { runCommandAsync } from '#utils/shell'
import { getLocalized } from '#utils/localization'
import { useLogger } from '#utils/logger'

import chalk from 'chalk'
const { yellow } = chalk

const messages = await getLocalized()
const logger = useLogger(messages)

type DepType = 'dependencies' | 'devDependencies'

interface MirtaConfig {
  templates?: string[]
}

const rootDir = toPosix(
  process.cwd()
)

const context = await resolveMonorepoContextAsync(rootDir)

// Список всех пакетов репозитория.
const packages: Record<string, Pick<PackageDefinition, 'workspacePath' | 'isPrivate'>> = {}

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

let _templatePathsCache: string[] | undefined

export async function resolveTemplatePaths(): Promise<string[]> {

  const configPath = posix.join(rootDir, 'mirta.config.json')

  const pathPatterns: string[] = []

  if (!existsSync(configPath))
    return pathPatterns

  let config: MirtaConfig

  try {

    config = JSON.parse(readFileSync(configPath, 'utf-8')) as MirtaConfig

  }
  catch (e: unknown) {

    logger.warn(`Failed to parse mirta.config.json: ${String(e)}`)
    return pathPatterns

  }

  if (!Array.isArray(config.templates))
    return pathPatterns

  for (const templatePath of config.templates) {

    const resolvedDir = posix.resolve(rootDir, templatePath)

    if (!resolvedDir.startsWith(rootDir + posix.sep)) {

      logger.warn(`Template path '${templatePath}' is not located inside the workspace root. Skipping`)
      continue

    }

    pathPatterns.push(
      posix.join(templatePath, '**', 'package.json')
    )

  }

  const templatePkgPaths = new Set<string>()

  if (pathPatterns.length === 0)
    return pathPatterns

  for await (const pkgPath of glob(pathPatterns, {
    cwd: rootDir,
    exclude: ['node_modules/**', 'dist/**'],
  })) {

    templatePkgPaths.add(
      toPosix(pkgPath)
    )

  }

  return [...templatePkgPaths]

}

async function getTemplatePaths() {

  return _templatePathsCache ??= await resolveTemplatePaths()

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

function updateTemplateDependencies(pkgPath: string, version: string) {

  logger.step(pkgPath)

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
      ? '- <root>'
      : `- ${pkg.name ?? nodePath.basename(pkgRoot)}`
  )

  pkg.version = version

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

}

export async function updateVersion(version: string) {

  logger.log(`Patching all packages to version ${version}`)

  // Обновляет корневой пакет.
  updatePackageVersion(
    rootDir,
    version
  )

  rootPackage.version = version

  // Обновляет все остальные пакеты репозитория.
  for (const pkg of Object.values(packages)) {

    updatePackageVersion(
      nodePath.join(rootDir, pkg.workspacePath),
      version
    )

  }

  const templatePaths = await getTemplatePaths()

  // Обновляет пакеты, используемые в шаблонах.
  if (templatePaths.length > 0) {

    logger.log(`Patching template packages`)

    for (const path of templatePaths)
      updateTemplateDependencies(path, version)

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
      posix.join(rootDir, pkg.workspacePath),
      version,
      flags
    )

  }

}
