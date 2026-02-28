import ts from 'typescript';

import type { VisitorContext } from './types';
import { removeFileExtension } from './path';

/**
 * Создает кэш файлов по имени без расширения.
 *
 * @param program - Программа TypeScript
 * @returns Карта: ключ - имя файла без расширения, значение - объект файла
 *
 * @since 0.3.5
 *
 **/
function createSourceFilesCache(program: ts.Program): Map<string, ts.SourceFile> {

  return new Map(
    program.getSourceFiles().map(sourceFile => [
      removeFileExtension(sourceFile.fileName),
      sourceFile,
    ])
  );

}

/**
 * Получает файл из программы или создает его при необходимости.
 * Использует кэш для повышения производительности при повторных запросах.
 *
 * @param context - Контекст трансформера, содержащий ссылку на программу и кэш файлов.
 * @param fileName - Полный путь к файлу, который необходимо найти или создать.
 * @returns Экземпляр {@link ts.SourceFile} для существующего или созданного файла.
 *
 * @since 0.3.5
 *
 **/
export function resolveSourceFile(context: VisitorContext, fileName: string): ts.SourceFile {

  const { program, compilerOptions } = context;

  let result: ts.SourceFile | undefined
    = program.getSourceFile(fileName);

  if (result)
    return result;

  // Если кэш уже создан, используем его. Иначе создаем новый.
  const sourceFilesCache
    = context.sourceFilesCache ??= createSourceFilesCache(program);

  const normalizedFileName
    = removeFileExtension(fileName);

  // Попытка найти файл в кэше.
  result = sourceFilesCache.get(normalizedFileName);

  if (!result) {

    result = ts.createSourceFile(fileName, '', compilerOptions.target ?? ts.ScriptTarget.ESNext, false);
    sourceFilesCache.set(normalizedFileName, result);

  }

  return result;

}
