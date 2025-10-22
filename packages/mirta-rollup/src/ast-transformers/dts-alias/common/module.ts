import ts from 'typescript'
import nodePath from 'node:path'

import { IndexType, type VisitorContext } from './types'
import { isProjectFile, removeFileExtension, getRelativeOutputPath } from './path'
import { assertPathIsValid } from './security'
import { resolveSourceFile } from './file'

import { AstTransformError } from '#src/utils/errors'

/**
 * Анализирует путь модуля и определяет его тип (явный, неявный, пакетный или обычный).
 * Собирает метаданные о модуле для дальнейшей обработки путей импорта.
 *
 * @param path - Путь модуля из исходного кода (например, './dir' или 'package/index').
 * @param resolvedModule - Объект, содержащий информацию о разрешённом модуле из TypeScript.
 * @returns Объект с детализацией пути, включая тип индекса, имя файла, расширение и директорию.
 *
 * @since 0.3.5
 *
 **/
export function getPathDetails(path: string, resolvedModule: ts.ResolvedModuleFull) {

  const { resolvedFileName, packageId } = resolvedModule

  const implicitPackagePath = packageId?.subModuleName

  // Указывает, является ли модуль частью пакета (например, 'package/index').
  const isPackage = !!implicitPackagePath

  // Базовые данные разрешённого файла

  const resolvedBaseName = nodePath.basename(
    isPackage
      ? implicitPackagePath
      : resolvedFileName
  )

  const resolvedBaseNameNoExtension = resolvedBaseName
    ? removeFileExtension(resolvedBaseName)
    : undefined

  // const resolvedExtension = resolvedBaseName
  //   ? nodePath.extname(resolvedFileName)
  //   : undefined

  // Базовые данные оригинального модуля

  let baseName = isPackage
    ? undefined
    : nodePath.basename(path)

  let baseNameNoExtension = baseName
    ? removeFileExtension(baseName)
    : undefined

  let extName = baseName
    ? nodePath.extname(path)
    : undefined

  // Если имя оригинального модуля совпадает с разрешённым, убираем расширение.
  if (
    resolvedBaseNameNoExtension
    && baseName
    && resolvedBaseNameNoExtension === baseName
  ) {

    baseNameNoExtension = baseName
    extName = undefined

  }

  let indexType: IndexType

  if (isPackage) {

    // Модуль внутри пакета (например, import 'package/index').
    indexType = IndexType.ImplicitPackage

  }
  else if (baseNameNoExtension === 'index' && resolvedBaseNameNoExtension === 'index') {

    // Явный импорт файла index (например, import './dir/index').
    indexType = IndexType.Explicit

  }
  else if (baseNameNoExtension !== 'index' && resolvedBaseNameNoExtension === 'index') {

    // Неявный импорт index (например, import './dir').
    indexType = IndexType.Implicit

  }
  else {

    // Обычный файл, не связанный с index.
    indexType = IndexType.NonIndex

  }

  // Для неявных индексов убирает лишние поля оригинального
  // модуля, чтобы не отображать index и расширения.
  //
  if (indexType === IndexType.Implicit) {

    baseName = undefined
    baseNameNoExtension = undefined
    extName = undefined

  }

  return {
    // baseName,
    // baseNameNoExtension,
    extName,
    // resolvedBaseName,
    resolvedBaseNameNoExtension,
    // resolvedExtension,
    // resolvedDir: isPackage
    //  ? removeSuffix(resolvedFileName, `/${implicitPackageIndex}`)
    //  : nodePath.dirname(resolvedFileName),
    indexType,
    // implicitPackagePath,
    // resolvedFileName,
  }

}

/**
 * Генерирует новый относительный путь для импорта модуля, исключая расширения и индексные файлы.
 * Проверяет безопасность пути и убеждается, что файл находится внутри корня проекта.
 *
 * @param context - Контекст трансформера, содержащий информацию о текущем файле и конфигурации.
 * @param oldPath - Путь модуля из исходного импорта (например, './utils/index').
 * @returns Относительный путь без расширения и индекса, или `undefined`, если модуль недопустим.
 *
 * @since 0.3.5
 *
 **/
export function resolveNewModulePath(context: VisitorContext, oldPath: string) {

  assertPathIsValid(oldPath)

  const {

    // Текущий обрабатываемый файл.
    sourceFile: currentSourceFile,

    // Актуальная конфигурация TypeScript.
    compilerOptions,

  } = context

  // Получаем модуль импортированного файла.
  //
  const { resolvedModule: importedModule } = ts.resolveModuleName(
    oldPath,
    currentSourceFile.fileName,
    compilerOptions,
    ts.sys
  )

  if (!importedModule)
    throw AstTransformError.get('moduleNotFound', oldPath, currentSourceFile.fileName)

  if (!isProjectFile(importedModule.resolvedFileName, context.rootDir))
    return null

  // Получает детали пути импортированного модуля.
  const pathDetails = getPathDetails(oldPath, importedModule)

  const { indexType, resolvedBaseNameNoExtension, extName } = pathDetails

  let outputBaseName = resolvedBaseNameNoExtension ?? ''

  if (indexType === IndexType.Implicit && outputBaseName.endsWith('index'))
    outputBaseName = outputBaseName.slice(0, -5)

  if (outputBaseName && extName)
    outputBaseName = `${outputBaseName}${extName}`

  // Получает исходный файл импортированного модуля.
  const importedSourceFile = resolveSourceFile(
    context,
    importedModule.resolvedFileName
  )

  const newPath = getRelativeOutputPath(
    currentSourceFile.fileName,
    importedSourceFile.fileName,
    outputBaseName
  )

  return newPath

}
