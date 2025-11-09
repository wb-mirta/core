/**
 * @file Bootstrap-сборка для первичной компиляции ключевых пакетов.
 *
 * @remarks
 * Используется, когда ни один пакет ещё не собран. Позволяет разорвать цикл:
 * `@mirta/rollup` нужен для сборки, но сам зависит от других пакетов.
 *
 * Решение: сборка напрямую из `src` с помощью `tsconfig`-алиасов,
 * которые подменяют импорты (`@mirta/workspace`) на пути к исходникам.
 *
 * После первой сборки `@mirta/rollup` становится доступен как готовый инструмент.
 * Дальнейшая сборка идёт уже через `dist`.
 *
 * @note
 * Это — единственная точка входа, способная собрать монорепозиторий с чистого листа.
 *
 * @since 0.4.0
 *
 **/

import { toPosix } from '@mirta/package'
import { definePackageConfig } from '@mirta/rollup'
import { compactArray } from '@mirta/basics/array'

/**
 * Корневая директория проекта, нормализованная к Unix-стилю (с `/`).
 * Обеспечивает кроссплатформенную совместимость путей.
 *
 **/
const cwd = toPosix(process.cwd())

/**
 * Формирует конфигурации для сборки пакета в монорепозитории.
 *
 * @remarks
 * Работает в бутстрап-режиме: запускается из корня, но настраивает сборку пакета.
 *
 * Особенности:
 * - `cwd`: указывает на директорию пакета → Rollup знает, где искать `tsconfig`, `package.json`
 * - `input`: передаётся как локальные пути (`src/index.ts`) → `definePackageConfig` сам добавит префикс
 *
 * @param workspace Имя папки в `packages/`
 * @param input Входные файлы (по умолчанию: `'src/index.ts'`)
 * @returns Массив конфигураций Rollup
 *
 * @since 0.4.0
 *
 **/
function buildPackage(workspace: string, input: string | string[] = 'src/index.ts') {

  input = compactArray(input)

  return definePackageConfig({
    cwd: `${cwd}/packages/${workspace}`,
    input,
  })

}

const configs = [

  ...buildPackage('mirta-basics',
    [
      'src/index.ts',
      'src/array/index.ts',
    ]),
  ...buildPackage('mirta-package'),
  ...buildPackage('mirta-workspace'),
  ...buildPackage('mirta-rollup',
    [
      'src/index.ts',
      'src/config.ts',
      'src/config-package.ts',
      'src/utils/env-loader.ts',
    ]),

  // TODO: Разобраться с зависимостями mirta-testing

  ...buildPackage('mirta-polyfills'),
  ...buildPackage('mirta'),
  ...buildPackage('mirta-testing',
    [
      'src/index.ts',
      'src/config/index.ts',
      'src/setup/global.ts',
    ]),

]

export default configs
