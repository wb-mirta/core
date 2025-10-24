import { findWorkspaceDir as pnpmFindWorkspaceDir } from '@pnpm/find-workspace-dir'
import { parsePackageJson } from './package'
import { PackageManagerError } from './errors'

/**
 * Описывает контекст воркспейсов монорепозитория.
 *
 * @remarks
 * Используется для хранения информации о структуре проекта,
 * включая корневой каталог и шаблоны путей к воркспейсам.
 *
 * @since 0.3.5
 *
 **/
export interface WorkspaceContext {
  /** Корневой каталог монорепозитория. */
  readonly rootDir: string
  /** Массив шаблонов путей к воркспейсам. */
  readonly workspaces: string[]
}

/**
 * Определяет корневой каталог монорепозитория.
 *
 * @param cwd - Текущая рабочая директория (current working directory), с которой начинается поиск.
 * @returns Обещание (Promise), разрешающееся в путь к корню монорепозитория.
 *          Возвращает `undefined`, если корень не найден (в теории, не должно случаться).
 * @throws {PackageManagerError} Выбрасывает ошибку, если проект использует неподдерживаемый менеджер пакетов.
 *
 * @remarks
 * В настоящее время поддерживается только PNPM.
 *
 * @since 0.3.5
 *
 **/
export async function findWorkspaceDirAsync(cwd: string): Promise<string | undefined> {

  if (process.env.PNPM_HOME)
    return await pnpmFindWorkspaceDir(cwd)

  // TODO: implement other package managers support.

  throw PackageManagerError.get('pnpmOnly')

}

/**
 * Получает контекст воркспейсов монорепозитория.
 *
 * @param cwd - Текущая рабочая директория для поиска корня репозитория.
 * @returns Обещание (Promise), разрешающееся в объект `WorkspaceContext` с информацией о структуре.
 *          Возвращает `undefined`, если корень репозитория не найден.
 * @throws {PackageManagerError} Выбрасывает ошибку, если в `package.json` отсутствует секция `workspaces`.
 *
 * @remarks
 * Зависит от функции `findWorkspaceDirAsync` для определения корня репозитория.
 *
 * @since 0.3.5
 *
 **/
export async function getWorkspaceContextAsync(cwd: string): Promise<WorkspaceContext | undefined> {

  const workspaceDir = await findWorkspaceDirAsync(cwd)

  if (workspaceDir) {

    const pkg = parsePackageJson(`${workspaceDir}/package.json`)

    if (!pkg.workspaces)
      throw PackageManagerError.get('noWorkspaces')

    return {
      rootDir: workspaceDir,
      workspaces: pkg.workspaces,
    }

  }

}
