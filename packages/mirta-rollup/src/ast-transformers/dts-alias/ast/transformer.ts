import ts from 'typescript';

import type { VisitorContextBase, VisitorContext, VisitorFunc } from '../common/types';
import { getRootDir } from '../common/path';
import { nodeVisitor } from './visitor';

/**
 * Фабрика трансформеров для Rollup, предназначенная для обработки файлов объявлений TypeScript (`.d.ts`).
 * Создаёт трансформер, который модифицирует пути импортов в декларациях, исключая расширения и индексные файлы.
 *
 * @param program - Экземпляр программы TypeScript, предоставляющий доступ к всем файлам проекта.
 * @returns Фабрика трансформеров, применяющаяся ко всем `.d.ts`-файлам.
 *
 * @since 0.3.5
 *
 **/
export function dtsAliasTransformerFactory(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {

  return (context) => {

    const compilerOptions = program.getCompilerOptions();

    /**
     * Базовый контекст для работы с AST-трансформером.
     * Содержит общие параметры и ссылки на программу TypeScript.
     *
     **/
    const visitorContextBase: VisitorContextBase = {
      compilerOptions,
      program,
      factory: context.factory,
      transformationContext: context,
    };

    return (sourceFile) => {

      /**
       * Обработка происходит только для файлов объявлений (`.d.ts`).
       * Обычные файлы (`*.ts`) игнорируются.
       *
       **/
      if (!sourceFile.isDeclarationFile)
        return sourceFile;

      /**
       * Контекст визитора, расширенный информацией о текущем файле и корне проекта.
       * Используется для передачи данных в `nodeVisitor`.
       *
       **/
      const visitorContext: VisitorContext = {

        ...visitorContextBase,

        sourceFile,
        rootDir: getRootDir(visitorContextBase, sourceFile),

        pathsCache: new Map<string, string | null>(),

        getVisitor() {

          return nodeVisitor.bind(this) as VisitorFunc;

        },
      };

      /**
       * Рекурсивный обход AST с применением визитора.
       * Обрабатывает все узлы файла, начиная с корня.
       *
       **/
      return ts.visitEachChild(sourceFile, visitorContext.getVisitor(), context);

    };

  };

}
