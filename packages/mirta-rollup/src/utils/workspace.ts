import nodePath from 'node:path'
import { findUp } from 'find-up'
import { parsePackageJson } from './package'
import { WorkspaceError } from './errors'

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
const lockFileMappings: Record<string, PackageManager> = {

  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lock': 'bun',
  'package-lock.json': 'npm',

} as const

/**
 * Проверяет, что поле `workspaces` в package.json имеет корректный формат.
 *
 * @param workspaces - Значение поля `workspaces`
 * @param pkgPath - Путь к package.json (для ошибки)
 *
 * @remarks
 *
 * ИИ-ассистенты иногда советуют использовать `workspaces: { packages: [...] }`
 * в package.json — это ошибка.
 *
 * Такой формат поддерживается только в:
 * - .yarnrc.yml
 * - pnpm-workspace.yaml
 *
 * В package.json всегда используйте массив:
 * ```json
 * { "workspaces": ["packages/*"] }
 * ```
 * @since 0.4.0
 *
 **/
function assertWorkspacesIsOptionalArray(workspaces: unknown, pkgPath: string): asserts workspaces is string[] | undefined {

  if (workspaces === null || workspaces === undefined)
    return

  if (Array.isArray(workspaces) && workspaces.every(item => typeof item === 'string'))
    return

  throw WorkspaceError.get('invalidWorkspaces', pkgPath.replaceAll(nodePath.win32.sep, nodePath.posix.sep))

}

/**
 * Асинхронно определяет контекст рабочей области (workspace), начиная с заданной директории.
 *
 * Поиск выполняется через обнаружение lock-файла (`package-lock.json`, `yarn.lock` и др.).
 *
 * На его основе определяются:
 * - Корневая директория;
 * - Пакетный менеджер;
 * - Список рабочих пространств из `package.json`.
 *
 * @param cwd - Текущая рабочая директория, с которой начинается поиск.
 * @returns Объект {@link WorkspaceContext} или `undefined`, если workspace не найден.
 *
 * @remarks
 * Функция требует наличия `package.json` в корневой директории для чтения поля `workspaces`.
 * Если `package.json` отсутствует или повреждён — выбрасывается {@link FileError}.
 * Если `workspaces` имеет недопустимый формат — выбрасывается {@link WorkspaceError}.
 *
 * @since 0.4.0
 *
 **/
export async function resolveWorkspaceContextAsync(cwd: string): Promise<WorkspaceContext | undefined> {

  const lockFiles = Object.keys(lockFileMappings)

  const lockFilePath = await findUp(lockFiles, { cwd })

  if (!lockFilePath)
    return

  const fileName = nodePath.basename(lockFilePath)
  const manager = lockFileMappings[fileName]

  const rootDir = nodePath.dirname(lockFilePath)

  const pkgPath = nodePath.join(rootDir, 'package.json')

  const pkg = parsePackageJson(pkgPath)

  assertWorkspacesIsOptionalArray(pkg.workspaces, pkgPath)

  const workspaces = pkg.workspaces

  return { rootDir, manager, workspaces }

}
