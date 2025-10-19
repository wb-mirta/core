import ts from 'typescript'
import nodePath from 'node:path'

import type { VisitorContextBase } from './types'
import { AstTransformError } from '#src/utils/errors'

/**
 * Удаляет расширение файла `.ts`, `.d.ts` или `.js`.
 *
 * @param fileName - Полное имя файла
 * @returns Имя файла без расширения
 *
 * @since 0.3.5
 *
 **/
export const removeFileExtension = (fileName: string): string =>
  fileName.replace(/\.d\.ts|\.[tj]s$/i, '')

/**
 * Находит общий префикс двух путей.
 *
 * @param a - Первый путь
 * @param b - Второй путь
 * @returns Общий префикс
 *
 * @since 0.3.5
 *
 **/
export function getCommonPrefix(a: string, b: string): string {

  const aParts = nodePath.normalize(a).split(nodePath.sep)
  const bParts = nodePath.normalize(b).split(nodePath.sep)

  const minLength = Math.min(aParts.length, bParts.length)
  let i = 0

  while (i < minLength && aParts[i] === bParts[i]) {

    i++

  }

  return aParts.slice(0, i).join(nodePath.sep)

}

/**
 * Вычисляет относительный путь от директории исходного файла к целевому файлу,
 * добавляет имя выходного файла и нормализует путь для совместимости с POSIX-системами.
 *
 * @param sourceFilePath - Полный путь к исходному файлу.
 * @param targetFilePath - Полный путь к целевому файлу.
 * @param outputName - Имя выходного файла, который будет добавлен к относительному пути.
 * @returns Нормализованный относительный путь с именем выходного файла.
 *
 * @example
 *
 * ```ts
 * const sourceFilePath = '/project/src/index.ts'
 * const targetFilePath = '/project/utils/index.ts'
 * const outputName = 'utils.d.ts'
 *
 * getRelativeOutputPath(sourceFilePath, targetFilePath, outputName) // Возвращает './utils.d.ts'
 *
 * ```
 * @since 0.3.5
 *
 **/
export function getRelativeOutputPath(
  sourceFilePath: string,
  targetFilePath: string,
  outputFileName: string
) {

  // Шаг 1: Получаем директорию исходного файла.
  const sourceDir = nodePath.dirname(sourceFilePath)

  // Шаг 2: Вычисляем относительный путь от директории исходного файла до целевого файла.
  const relativeDir = nodePath.dirname(nodePath.relative(sourceDir, targetFilePath))

  // Шаг 3: Объединяем относительную директорию с именем выходного файла.
  let relativePath = nodePath.posix.join(relativeDir, outputFileName)

  // Шаг 4: Гарантируем, что путь является относительным.
  if (!relativePath.startsWith('.'))
    relativePath = `./${relativePath}`

  return relativePath

}

/**
 * Определяет корневую директорию файла на основе конфигурации.
 *
 * @param context - Базовый контекст
 * @param sourceFile - Обрабатываемый файл
 * @returns Путь к корню проекта
 * @throws Ошибка, если файлы не найдены
 *
 * @since 0.3.5
 *
 **/
export function getRootDir(
  context: VisitorContextBase,
  sourceFile: ts.SourceFile
) {

  const { compilerOptions, program } = context

  // Если rootDirs указаны — ищем, к какому корню относится файл.

  if (compilerOptions.rootDirs?.length) {

    const sortedRoots = [...compilerOptions.rootDirs]
      .sort((a, b) => b.length - a.length)

    for (const rootDir of sortedRoots) {

      if (sourceFile.fileName.startsWith(rootDir))
        return rootDir

    }

  }

  // Если rootDir указан — используем его.

  if (compilerOptions.rootDir)
    return compilerOptions.rootDir

  // Иначе находим общий корень для всех файлов.

  const fileNames = program.getRootFileNames()

  if (!fileNames.length)
    throw AstTransformError.get('noRootFilesInProject')

  let commonPrefix = fileNames[0]

  for (const fileName of fileNames.slice(1)) {

    commonPrefix = getCommonPrefix(commonPrefix, fileName)

  }

  return commonPrefix

}
