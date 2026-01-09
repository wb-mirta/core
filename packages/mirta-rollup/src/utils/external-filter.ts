import nodePath from 'node:path'
import type { ExternalOption } from 'rollup'
import { ensureCompactArray } from '@mirta/basics/array'

/**
 * Создаёт предикат для проверки, следует ли считать модуль внешним по набору правил.
 *
 * @param cwd - рабочая директория. Пути за её пределами считаются внешними.
 * @param externals - список функций или паттернов (строки, RegExp или массивы таких значений), определяющих внешние модули
 * @returns `true` если модуль считается внешним, `false` в противном случае
 */
export function createExternalFilter(cwd: string, ...externals: ExternalOption[]) {

  /**
   * Функция-предикат для определения внешнего модуля
   *
   * @param target Целевой путь/имя модуля
   * @param importer Имя файла, который импортирует модуль (если доступно)
   * @param isResolved Флаг, указывающий, был ли модуль успешно разрешён
   * @returns `true`, если модуль внешний, иначе false
   */
  return (target: string, importer: string | undefined, isResolved: boolean): boolean => {

    for (const external of externals) {

      // Шаг 1: Пользовательская функция
      if (typeof external === 'function') {

        if (external(target, importer, isResolved))
          return true

      }
      else {

        // Шаг 2: Массив паттернов
        const isExternal = ensureCompactArray(external).some((item) => {

          if (item instanceof RegExp)
            return item.test(target)

          return item === target

        })

        if (isExternal)
          return true

      }

    }

    // Шаг 3: Путь вне cwd (только для обнаруженных модулей)
    if (isResolved && cwd && nodePath.isAbsolute(target)) {

      const relativePath = nodePath.relative(cwd, target)

      // Если путь вне cwd, отмечаем его как внешний
      if (relativePath.startsWith('..') || nodePath.isAbsolute(relativePath)) {

        return true

      }

    }

    // Шаг 4: По умолчанию — внутренний
    return false

  }

}
