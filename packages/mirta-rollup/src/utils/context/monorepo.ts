import nodePath from 'node:path'
import { glob } from 'node:fs/promises'
import { parsePackageJson } from '#utils/package'
import { WorkspaceError } from '#utils/errors'
import { toPosix } from '#utils/path'

import { resolveWorkspaceContextAsync, type WorkspaceContext, type PackageManager } from './workspace'

/**
 * Контекст монорепозитория, содержащий корневую директорию и список пакетов.
 *
 * Является результатом анализа структуры монорепы.
 *
 * @since 0.3.5
 *
 **/
export interface MonorepoContext {
  /**
   * Абсолютный путь к корневой директории монорепозитория.
   * Место, где находится `package.json` с полем `workspaces`.
   *
   **/
  readonly rootDir: string

  /**
   * Определённый пакетный менеджер, используемый в проекте.
   *
   **/
  readonly manager: PackageManager

  /**
   * Список всех пакетов, объявленных в рабочих пространствах.
   * Отсортирован по длине пути (от самых вложенных).
   *
   **/
  readonly packages: readonly PackageDefinition[]
}

/**
 * Описывает структуру пакета в монорепозитории.
 *
 * Содержит имя пакета и его путь относительно корня монорепы.
 *
 * @since 0.3.5
 *
 **/
export interface PackageDefinition {
  /**
   * Имя пакета, указанное в `package.json`.
   *
   **/
  readonly name: string

  /**
   * Путь к пакету относительно корня монорепозитория.
   * Используется для сопоставления чанков с пакетами.
   *
   **/
  readonly workspacePath: string
}

/**
 * Кэш пакетов монорепозитория по корневой директории.
 * Позволяет избежать повторного сканирования файловой системы.
 *
 * @since 0.4.0
 *
 **/
const packagesCache = new Map<string, readonly PackageDefinition[]>()

/**
 * Сбрасывает внутреннее состояние модуля, очищая кэш обнаруженных пакетов.
 *
 * @remarks
 *
 * Функция предназначена исключительно для использования во время выполнения тестов.
 * В production-среде (когда глобальная переменная `__TEST__` равна `false`) функция не выполняет никаких действий.
 *
 * @internal
 *
 * @since 0.4.0
 *
 **/
export function __resetInternalState() {

  if (!__TEST__)
    return

  packagesCache.clear()

}

/**
 * Асинхронно разрешает контекст монорепозитория.
 *
 * Находит корень проекта, пакетный менеджер и все пакеты, объявленные в `workspaces`.
 *
 * @param cwd - Рабочая директория, с которой начинается поиск.
 * @returns Объект {@link MonorepoContext} с информацией о монорепе.
 * @throws {WorkspaceError} Если корень не найден или какой-либо из пакетов не имеет имени.
 * @throws {FileError} Если `package.json` недоступен или содержит невалидный JSON.
 *
 * @remarks
 * - Требуется наличие lock-файла и поля `workspaces` в корневом `package.json`.
 * - Все пути возвращаются в POSIX-формате.
 *
 * @since 0.4.0
 *
 **/
export async function resolveMonorepoContextAsync(
  cwd: string
): Promise<MonorepoContext> {

  const context = await resolveWorkspaceContextAsync(cwd)

  const packages = await resolveMonorepoPackagesAsync(context)

  return {
    rootDir: context.rootDir,
    manager: context.manager,
    packages,
  }

}

/**
 * Асинхронно разрешает список пакетов монорепы.
 *
 * Находит все `package.json` в директориях, указанных в `workspaces`.
 *
 * @param context - Контекст workspace.
 * @returns Массив пакетов, отсортированный по длине пути (от самых вложенных).
 * @throws {WorkspaceError} Если пакет не имеет имени.
 *
 * @remarks
 * - Результат кэшируется по `rootDir` для производительности.
 * - Сортировка нужна, чтобы при сопоставлении по пути сначала проверялись более специфичные пакеты.
 *
 * @since 0.4.0
 *
 **/
export async function resolveMonorepoPackagesAsync(

  context: WorkspaceContext

): Promise<readonly PackageDefinition[]> {

  const { rootDir, workspaces = [] } = context

  const cachedPackages = packagesCache.get(rootDir)

  // 1. Проверяем кэш
  if (cachedPackages !== undefined)
    return cachedPackages

  const pkgPatterns = workspaces.map(w => `${w}/package.json`)

  const packages: PackageDefinition[] = []

  for await (const rawPkgPath of glob(pkgPatterns, {
    cwd: rootDir,
    exclude: ['node_modules/**'],
  })) {

    const pkgPath = toPosix(rawPkgPath)
    const pkg = parsePackageJson(`${rootDir}/${pkgPath}`)

    if (!pkg.name)
      throw WorkspaceError.get('noPackageName', pkgPath)

    packages.push({
      name: pkg.name,
      workspacePath: nodePath.dirname(pkgPath),
    })

  }

  // Сортируем по убыванию длины пути, чтобы сначала шли более вложенные пакеты
  // (например, packages/heat/thermostat перед packages/heat).
  //
  // При равной длине — по лексикографическому порядку, чтобы порядок был детерминирован.
  // Это необходимо для корректной идентификации пакета по chunkName.
  //
  packages.sort((a, b) => {

    const lengthDiff = b.workspacePath.length - a.workspacePath.length

    if (lengthDiff !== 0)
      return lengthDiff

    return a.workspacePath.localeCompare(b.workspacePath) // Лексикографически

  })

  const frozenPackages = Object.freeze(packages)

  packagesCache.set(rootDir, frozenPackages)

  return frozenPackages

}

/**
 * Находит пакет, которому принадлежит указанный чанк.
 *
 * Поиск выполняется по префиксу пути: первый пакет, чей `workspacePath`
 * является началом `chunkName`, считается владельцем.
 *
 * @param context - Контекст монорепозитория с уже загруженными пакетами.
 * @param chunkName - Имя чанка (обычно путь к исходному файлу).
 * @returns Объект {@link PackageDefinition} или `undefined`, если пакет не найден.
 *
 * @remarks
 * Пакеты должны быть отсортированы по убыванию длины пути,
 * чтобы более вложенные пакеты проверялись первыми.
 *
 * @since 0.3.5
 *
 **/
export function findMonorepoPackageByChunkName(
  context: MonorepoContext,
  chunkName: string
): PackageDefinition | undefined {

  for (const pkg of context.packages) {

    if (chunkName.startsWith(pkg.workspacePath))
      return pkg

  }

}

/**
 * Преобразует путь к чанку в путь внутри `node_modules`.
 *
 * Используется для генерации путей импортов в сборке.
 *
 * @param chunkName - Полный путь к чанку, относительно корня монорепы.
 * @param pkgDefinition - Описание пакета, содержащего чанк.
 * @returns Строка в формате `node_modules/<имя-пакета>/<относительный-путь>`.
 *
 * @example
 * ```ts
 * mapChunkToPackage('packages/ui/button.ts', {
 *   name: '@my/ui',
 *   workspacePath: 'packages/ui'
 * })
 * // → 'node_modules/@my/ui/button.ts'
 * ```
 * @since 0.3.5
 *
 **/
export function mapChunkToPackage(chunkName: string, pkgDefinition: PackageDefinition) {

  return 'node_modules/'.concat(
    pkgDefinition.name,
    '/',
    nodePath.posix.relative(pkgDefinition.workspacePath, chunkName)
  )

}
