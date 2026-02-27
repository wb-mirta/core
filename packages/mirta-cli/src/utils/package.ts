import nodePath, { posix } from 'node:path';

import pMap from 'p-map';

import { glob, writeFile } from 'node:fs/promises';

import { resolveMonorepoContextAsync, type PackageDefinition } from '@mirta/workspace';
import { PackageError, readPackageAsync, resolvePackagePath, toPosix, type Package } from '@mirta/package';

import { THIS_PACKAGE_NAME } from '#src/constants';

import { runCommandAsync } from '#utils/shell';

import chalk from 'chalk';
import { t } from '../i18n';
import type { MirtaConfig } from '#src/config/types';
import { logger } from '#utils/logger';

const { yellow } = chalk;

const MAX_CONCURRENT_WRITES = 5;
const MAX_CONCURRENT_REQUESTS = 5;

type DepType = 'dependencies' | 'devDependencies';

const cwd = process.cwd();
const context = await resolveMonorepoContextAsync(cwd);
const rootDir = context.rootDir;

// Список всех пакетов репозитория.
const packages: Record<string, Pick<PackageDefinition, 'workspacePath' | 'isPrivate'>> = {};

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
    };

}

const rootPackage = await readPackageAsync(rootDir);

/** Возвращает текущую версию корневого проекта. */
export function getCurrentVersion() {

  if (!rootPackage.version)
    throw PackageError.getScoped(THIS_PACKAGE_NAME, 'noVersionField');

  return rootPackage.version;

}

export function hasScript(name: string) {

  return rootPackage.scripts?.[name] !== void 0;

}

export async function resolveTemplatePathsAsync(config: MirtaConfig): Promise<string[]> {

  const templates = config.project?.templates;

  if (!Array.isArray(templates))
    return [];

  const pathPatterns: string[] = [];

  for (const templatePath of templates) {

    const resolvedDir = toPosix(nodePath.resolve(rootDir, templatePath));

    if (!resolvedDir.startsWith(rootDir + posix.sep)) {

      logger.warn(t('package.templateOutsideRoot', { template: templatePath }));
      continue;

    }

    pathPatterns.push(
      posix.join(templatePath, '**', 'package.json')
    );

  }

  const realPaths = new Set<string>();

  if (pathPatterns.length === 0)
    return [];

  for await (const pkgPath of glob(pathPatterns, {
    cwd: rootDir,
    exclude: ['node_modules/**', 'dist/**'],
  })) {

    realPaths.add(toPosix(pkgPath));

  }

  return [...realPaths];

}

const isWorkspacePackage = (pkgName: string) => {

  return Boolean(pkgName && packages[pkgName]);

};

function updateDependencies(
  pkg: Package,
  depType: DepType,
  version: string
) {

  const deps = pkg[depType];

  if (!deps)
    return;

  Object.keys(deps).forEach((dep) => {

    if (!isWorkspacePackage(dep))
      return;

    deps[dep] = version;

    logger.step(`- ${dep}`);

  });

}

async function updateTemplateDependencies(pkgPath: string, version: string) {

  logger.step(pkgPath);

  const pkg = await readPackageAsync(pkgPath);

  updateDependencies(pkg, 'dependencies', version);
  updateDependencies(pkg, 'devDependencies', version);

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

}

async function updatePackageVersion(pkgRoot: string, version: string) {

  const pkgPath = resolvePackagePath(pkgRoot);
  const pkg = await readPackageAsync(pkgPath);

  logger.step(
    pkgRoot === rootDir
      ? '- <root>'
      : `- ${pkg.name ?? nodePath.basename(pkgRoot)}`
  );

  pkg.version = version;

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

}

export async function updateVersion(version: string, config: MirtaConfig) {

  logger.log(`Patching all packages to version ${version}`);

  // Обновляет корневой пакет.
  await updatePackageVersion(
    rootDir,
    version
  );

  rootPackage.version = version;

  // Обновляет все остальные пакеты репозитория.
  await pMap(
    Object.values(packages),
    ({ workspacePath }) => updatePackageVersion(
      nodePath.join(rootDir, workspacePath),
      version
    ),
    { concurrency: MAX_CONCURRENT_WRITES }
  );

  // Повторное сканирование FS на каждое обновление - для безопасности.
  const templatePaths = await resolveTemplatePathsAsync(config);

  // Обновляет пакеты, используемые в шаблонах.
  if (templatePaths.length > 0) {

    logger.log(`Patching template packages`);

    await pMap(
      templatePaths,
      path => updateTemplateDependencies(path, version),
      { concurrency: MAX_CONCURRENT_WRITES }
    );

  }

}

/** Выполняет сборку пакетов стандартной командой `pnpm run build`. */
export async function buildPackagesAsync(skipBuild: boolean) {

  if (!skipBuild) {

    logger.log('Building packages...');
    await runCommandAsync('pnpm', ['run', 'build']);

  }
  else {

    logger.log(`${yellow('Skip')} building packages`);

  }

}

/**
 * Проверяет существование пакета в NPM.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export async function checkPackageExistsAsync(pkgName: string): Promise<boolean> {

  try {

    await runCommandAsync('npm', ['view', pkgName, 'version'], {
      stdio: 'pipe',
    });

    return true;

  }
  catch (e: unknown) {

    if (e instanceof Error) {

      const message = e.message;

      if (message.includes('404'))
        return false;

    }

    throw e;

  }

}

async function publishSinglePackageAsync(
  pkgName: string,
  pkgPath: string,
  version: string,
  flags: string[]
) {

  let releaseTag: string | undefined = void 0;

  if (version.includes('alpha')) {

    releaseTag = 'alpha';

  }
  else if (version.includes('beta')) {

    releaseTag = 'beta';

  }
  else if (version.includes('rc')) {

    releaseTag = 'rc';

  }

  logger.step(t('publish.packagePublishing', { name: pkgName }));

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
    );

    logger.success(t('publish.packagePublished', { name: `${pkgName}@${version}` }));

  }
  catch (e: unknown) {

    if (e instanceof Error && /previously published/.exec(e.message)) {

      logger.warn(t('publish.skippingPublished', { name: pkgName }));

    }
    else {

      throw e;

    }

  }

}

/** Выполняет публикацию пакетов монорепозитория в NPM. */
export async function publishPackagesAsync(
  version: string,
  skipGitChecks: boolean,
  isDryRun: boolean
) {

  logger.log(t('publish.begin'));

  const packagesToPublish = Object.entries(packages)
    .filter(([, pkg]) => !pkg.isPrivate);

  if (!isDryRun) {

    const existenceChecks = await pMap(
      packagesToPublish,
      async ([pkgName]) => ({
        name: pkgName,
        isExists: await checkPackageExistsAsync(pkgName),
      }),
      { concurrency: MAX_CONCURRENT_REQUESTS, stopOnError: true }
    );

    const unpublishedPackages = existenceChecks
      .filter(({ isExists }) => !isExists)
      .map(({ name }) => name);

    if (unpublishedPackages.length > 0) {

      logger.error(t('publish.newPackages', {
        packages: unpublishedPackages.join(', '),
      }));

      logger.error(t('publish.initialPublishRequired'));

      throw new Error('Packages not found in NPM registry');

    }

  }

  const flags: string[] = [];

  if (isDryRun)
    flags.push('--dry-run');

  if (isDryRun || skipGitChecks || process.env.CI)
    flags.push('--no-git-checks');

  if (process.env.CI)
    flags.push('--provenance');

  for (const [pkgName, pkg] of packagesToPublish) {

    // Приватные пакеты не публикуются.
    if (pkg.isPrivate) {

      logger.step(t('publish.skippingPrivate', { name: pkgName }));
      continue;

    }

    await publishSinglePackageAsync(
      pkgName,
      posix.join(rootDir, pkg.workspacePath),
      version,
      flags
    );

  }

}
