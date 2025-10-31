import nodePath from 'node:path'
import { glob } from 'node:fs/promises'

import { parsePackageJson } from './package'
import { WorkspaceError } from './errors'
import { resolveWorkspaceContextAsync, type WorkspaceContext } from './workspace'

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
 * Получает полный контекст монорепозитория.
 *
 * Включает корневую директорию и все найденные пакеты.
 * Если проект не является монорепозиторием — возвращает `undefined`.
 *
 * @param cwd - Текущая рабочая директория, с которой начинается поиск.
 * @returns Объект {@link MonorepoContext} или `undefined`, если монорепа не найдена.
 *
 * @remarks
 * Использует {@link resolveWorkspaceContextAsync} для определения корня
 * и {@link tryGetMonorepoPackagesAsync} для получения списка пакетов.
 *
 * @since 0.3.5
 *
 **/
export async function getMonorepoContextAsync(
  cwd: string
): Promise<MonorepoContext | undefined> {

  const context = await resolveWorkspaceContextAsync(cwd)

  if (!context)
    return undefined

  const packages = await tryGetMonorepoPackagesAsync(context)

  if (!packages)
    return undefined

  return {
    rootDir: context.rootDir,
    packages,
  }

}

/**
 * Возвращает список всех пакетов, объявленных в рабочих пространствах.
 *
 * Результат кэшируется по корневой директории для производительности.
 * Если `workspaces` не объявлено в `package.json`, возвращает `undefined`.
 *
 * @param context - Контекст рабочей области, содержащий корень и `workspaces`.
 * @returns Массив пакетов или `undefined`, если это не монорепозиторий.
 *
 * @remarks
 * Для каждого паттерна из `workspaces` ищутся файлы `package.json`.
 * Каждый найденный пакет добавляется в результат с именем и путём.
 * Результат сортируется по убыванию длины пути — это важно для корректного
 * сопоставления вложенных пакетов (например, `packages/a/b` до `packages/a`).
 *
 * @since 0.4.0
 *
 **/
export async function tryGetMonorepoPackagesAsync(

  context: WorkspaceContext

): Promise<readonly PackageDefinition[] | undefined> {

  const { rootDir, workspaces } = context

  const cachedPackages = packagesCache.get(rootDir)

  // 1. Проверяем кэш
  if (cachedPackages !== undefined)
    return cachedPackages

  // Если workspaces не объявлен — это НЕ монорепозиторий.
  if (!workspaces)
    return undefined

  const pkgPatterns = workspaces.map(w => `${w}/package.json`)

  const packages: PackageDefinition[] = []

  for await (const innerPkgPath of glob(pkgPatterns, {
    cwd: rootDir,
    exclude: ['node_modules/**'],
  })) {

    const innerPkg = parsePackageJson(
      nodePath.join(rootDir, innerPkgPath)
    )

    if (!innerPkg.name)
      throw WorkspaceError.get('noPackageName', innerPkgPath)

    packages.push({
      name: innerPkg.name,
      workspacePath: nodePath.dirname(innerPkgPath)
        .replaceAll('\\', nodePath.posix.sep),
    })

  }

  // Сортируем по убыванию длины пути, чтобы сначала проверялись
  // более вложенные пакеты (например, packages/heat/thermostat перед packages/heat)
  //
  // Это необходимо для корректной идентификации пакета по chunkName.
  //
  packages.sort((a, b) => b.workspacePath.length - a.workspacePath.length)

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

    if (chunkName.startsWith(pkg.workspacePath)) {

      return pkg

    }

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
