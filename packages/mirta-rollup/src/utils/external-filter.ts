import nodePath from 'node:path'
import type { ExternalOption } from 'rollup'
import { ensureCompactArray } from './array'

/**
 * Создаёт фильтр для определения внешних модулей на основе указанных правил.
 *
 * @param cwd Рабочая директория проекта (используется для проверки относительных путей)
 * @param externals Набор паттернов или функций для определения внешних модулей
 * @returns Функция-предикат, которая принимает параметры модуля и возвращает true,
 *          если модуль должен быть считаться внешним
 *
 * @returns Функция-предикат `(target: string, importer: string | undefined, isResolved: boolean): boolean`,
 *          которая возвращает `true`, если модуль считается внешним.
 *
 * @since 0.3.5
 *
 **/
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

        if (__DEV__)
          console.debug(`Skipping non-project "${relativePath}"`)

        return true

      }

    }

    // Шаг 4: По умолчанию — внутренний
    return false

  }

}
