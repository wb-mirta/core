import nodePath from 'node:path'

import { findWorkspaceDir as pnpmFindWorkspaceDir } from '@pnpm/find-workspace-dir'
import { findWorkspacePackages } from '@pnpm/workspace.find-packages'
import { parsePackageJson } from './package'
import { PackageManagerError, WorkspaceError } from './errors'

/**
 * Описывает структуру пакета монорепозитория.
 *
 * @since 0.3.5
 *
 **/
export interface PackageDefinition {
  /** Путь относительно корня монорепозитория. */
  readonly workspacePath: string
  /** Имя пакета. */
  readonly name?: string
}

/**
 * Контекст монорепозитория, содержащий информацию о структуре проекта.
 *
 * @since 0.3.5
 *
 **/
export interface MonorepoContext {
  /** Абсолютный путь к корневой директории монорепозитория */
  readonly rootDir: string
  /** Массив всех пакетов в рабочем пространстве */
  readonly packages: PackageDefinition[]
}

/**
 * Определяет корень монорепозитория по текущей директории.
 *
 * @param cwd - Текущая рабочая директория для поиска
 * @returns Promise<string | undefined> - Абсолютный путь к корню или undefined
 * @throws {PackageManagerError} Если используется неподдерживаемый менеджер пакетов
 *
 * @remarks
 * Поддерживает только PNPM в текущей реализации.
 *
 * @since 0.3.5
 *
 **/
export async function findMonorepoDirAsync(cwd: string): Promise<string | undefined> {

  if (process.env.PNPM_HOME)
    return await pnpmFindWorkspaceDir(cwd)

  // TODO: реализовать поддержку остальных пакетных менеджеров.

  throw PackageManagerError.get('pnpmOnly')

}

/**
 * Формирует относительный путь в формате posix.
 *
 * @param workspaceDir - Корневая директория монорепозитория
 * @param packageRootDir - Директория конкретного пакета
 * @returns Стандартизированный относительный путь с завершающим слешем
 *
 **/
function getWorkspacePath(workspaceDir: string, packageRootDir: string): string {

  return nodePath.relative(workspaceDir, packageRootDir)
    .replaceAll(nodePath.sep, nodePath.posix.sep) + '/'

}

/**
 * Получает полную информацию о структуре монорепозитория.
 *
 * @param cwd - Текущая рабочая директория для поиска
 * @returns Объект контекста {@link MonorepoContext} или undefined
 * @throws {WorkspaceError} Если проект определён как монорепозиторий и отсутствует секция `workspaces` в package.json
 *
 * @since 0.3.5
 *
 **/
export async function getMonorepoContextAsync(cwd: string): Promise<MonorepoContext | undefined> {

  const monorepoDir = await findMonorepoDirAsync(cwd)

  if (monorepoDir) {

    const pkg = parsePackageJson(`${monorepoDir}/package.json`)

    if (!pkg.workspaces)
      throw WorkspaceError.get('noWorkspaces')

    const packages = await findWorkspacePackages(monorepoDir, {
      patterns: pkg.workspaces,
    })

    const context: MonorepoContext = {
      rootDir: monorepoDir,
      packages: packages
        // Не рассматриваем корневой каталог в качестве пакета.
        .filter(x => x.rootDir !== monorepoDir)
        // Сортируем по длине пути к корню монорепозитория (самые длинные первыми).
        .sort((a, b) => b.rootDir.length - a.rootDir.length)
        // Создаём массив объектов с информацией о пакетах монорепозитория.
        .map<PackageDefinition>(item => ({
          workspacePath: getWorkspacePath(monorepoDir, item.rootDir),
          name: item.manifest.name,
        })),
    }

    return context

  }

}

/**
 * Поиск пакета по имени чанка
 *
 * @param context - Контекст монорепозитория
 * @param chunkName - Имя чанка (обычно путь к файлу)
 * @returns PackageDefinition | undefined - Найденный пакет или undefined
 *
 * @since 0.3.5
 *
 **/
export function findMonorepoPackageByChunkName(
  context: MonorepoContext,
  chunkName: string
): PackageDefinition | undefined {

  for (const pkg of context.packages) {

    if (chunkName.startsWith(pkg.workspacePath)) {

      return pkg

    }

  }

}

/**
 * Преобразует путь к чанку в путь внутри node_modules
 *
 * @param chunkName - Полный путь к чанку
 * @param pkgDefinition - Определение пакета
 * @returns Строка в формате node_modules/<package-name>/<relative-path>
 * @throws {WorkspaceError} Если имя пакета не указано
 *
 * @since 0.3.5
 *
 **/
export function mapChunkToPackage(chunkName: string, pkgDefinition: PackageDefinition) {

  if (!pkgDefinition.name)
    throw WorkspaceError.get('noPackageName', pkgDefinition.workspacePath)

  return 'node_modules/'.concat(
    pkgDefinition.name,
    '/',
    nodePath.posix.relative(pkgDefinition.workspacePath, chunkName)
  )

}
