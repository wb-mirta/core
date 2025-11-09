import nodePath from 'node:path'
import { findUp } from 'find-up'
import { readPackageAsync, toPosix } from '@mirta/package'
import { WorkspaceError } from '../errors'

/**
 * Тип пакетного менеджера.
 *
 * @since 0.4.0
 *
 **/
export type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm'

/**
 * Описывает контекст рабочей области (workspace).
 *
 * Содержит информацию о корневой директории, используемом пакетном менеджере
 * и объявленных рабочих пространствах (workspaces).
 *
 * @since 0.4.0
 *
 **/
export interface WorkspaceContext {

  /**
   * Корневая директория workspace — место расположения lock-файла.
   **/
  readonly rootDir: string

  /**
   * Определённый пакетный менеджер, используемый в проекте.
   **/
  readonly manager: PackageManager

  /**
   * Необязательный массив glob-паттернов, определяющих пути к пакетам в монорепозитории.
   *
   * Соответствует полю `workspaces` в `package.json`.
   * Должен быть массивом строк, например: `["packages/*"]`.
   *
   **/
  readonly workspaces?: readonly string[]

}

/**
 * Сопоставление lock-файлов с пакетными менеджерами.
 *
 * @since 0.4.0
 *
 **/
const lockFileMappings = {

  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lock': 'bun',
  'package-lock.json': 'npm',

} as const satisfies Record<string, PackageManager>

/**
 * Проверяет, что поле `workspaces` в `package.json` имеет корректный формат.
 * Должно быть массивом строк или отсутствовать. Использование объекта (например, `{ packages: [...] }`) недопустимо.
 *
 * @param workspaces - Значение поля `workspaces` для проверки.
 * @param pkgPath - Путь к package.json (используется в сообщении об ошибке).
 *
 * @throws {WorkspaceError} Если формат неверен.
 *
 * @since 0.4.0
 *
 **/
function assertWorkspacesFieldFormat(workspaces: unknown, pkgPath: string): asserts workspaces is string[] | undefined {

  if (workspaces === null || workspaces === undefined)
    return

  if (Array.isArray(workspaces) && workspaces.every(item => typeof item === 'string'))
    return

  throw WorkspaceError.get('invalidWorkspaces', pkgPath.replaceAll(nodePath.win32.sep, nodePath.posix.sep))

}

/**
 * Асинхронно определяет контекст рабочей области (workspace), начиная с заданной директории.
 *
 * Находит корень проекта по наличию lock-файла (pnpm/yarn/npm/bun), читает `package.json`
 * и извлекает информацию о пакетном менеджере и рабочих пространствах.
 *
 * @param cwd - Рабочая директория, с которой начинается поиск.
 * @returns Объект {@link WorkspaceContext} с корнем, менеджером и полем `workspaces` (если есть).
 * @throws {WorkspaceError} Если lock-файл не найден или `workspaces` имеет недопустимый формат.
 * @throws {PackageError} Если `package.json` отсутствует, недоступен или содержит невалидный JSON.
 *
 * @remarks
 * - Поле `workspaces` может отсутствовать — это не ошибка.
 * - Все пути возвращаются в POSIX-формате.
 *
 * @since 0.4.0
 *
 **/
export async function resolveWorkspaceContextAsync(cwd: string): Promise<WorkspaceContext> {

  const lockFiles = Object.keys(lockFileMappings)

  const lockFilePath = toPosix(
    await findUp(lockFiles, { cwd })
  )

  if (!lockFilePath)
    throw WorkspaceError.get('noLockfile')

  const rootDir = nodePath.dirname(lockFilePath)

  const pkgPath = `${rootDir}/package.json`
  const pkg = await readPackageAsync(pkgPath)

  assertWorkspacesFieldFormat(pkg.workspaces, pkgPath)

  const fileName = nodePath.basename(lockFilePath) as keyof typeof lockFileMappings

  return {
    rootDir,
    manager: lockFileMappings[fileName],
    workspaces: pkg.workspaces,
  }

}
