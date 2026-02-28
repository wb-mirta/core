import ts from 'typescript';

import type { VisitorContext } from '../common/types';
import { resolveNewModulePath } from '../common/module';

const aliasPattern = /^[@#]/;

/**
 * Обновляет спецификатор модуля в узле импорта или экспорта.
 *
 * @param factory - Фабрика для создания новых узлов AST.
 * @param node - Узел импорта или экспорта.
 * @param newModuleSpecifier - Новый относительный путь.
 * @returns Обновлённый узел.
 *
 * @since 0.3.5
 *
 **/
export function updateModuleSpecifier(
  factory: ts.NodeFactory,
  node: ts.ImportDeclaration | ts.ExportDeclaration,
  newModuleSpecifier: string
) {

  if (ts.isImportDeclaration(node)) {

    return factory.updateImportDeclaration(
      node,
      node.modifiers,
      node.importClause,
      factory.createStringLiteral(newModuleSpecifier),
      node.attributes
    );

  }
  else if (ts.isExportDeclaration(node)) {

    return factory.updateExportDeclaration(
      node,
      node.modifiers,
      node.isTypeOnly,
      node.exportClause,
      factory.createStringLiteral(newModuleSpecifier),
      node.attributes
    );

  }

  return node;

}

/**
 * Рекурсивно обходит дочерние узлы AST с текущим визитором.
 */
export function visitChildren(context: VisitorContext, node: ts.Node) {

  return ts.visitEachChild(node, context.getVisitor(), context.transformationContext);

}

/**
 * Визитор для обработки узлов AST, связанных с импортами.
 *
 * Обновляет пути модулей, начинающиеся с `#` или `@`, в файлах объявлений TypeScript.
 *
 * @param this - Контекст трансформера, предоставляющий инструменты для работы с AST.
 * @param node - Текущий узел AST, который проверяется и, при необходимости, обновляется.
 * @returns Обновленный узел AST или результат рекурсивного обхода дочерних узлов.
 *
 * @example
 * ```ts
 * // Исходный узел импорта:
 * import { foo } from '#utils/index'
 *
 * // После обработки:
 * import { foo } from './utils'
 *
 * ```
 * @since 0.3.5
 *
 **/
export function nodeVisitor(this: VisitorContext, node: ts.Node): ts.Node | undefined {

  if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
    return visitChildren(this, node);

  const moduleSpecifier = node.moduleSpecifier;

  if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier))
    return visitChildren(this, node);

  // Извлекаем путь импорта/экспорта (указывается в кавычках после from).
  const { text: oldPath } = moduleSpecifier;

  // Проверяем, относится ли спецификатор к алиасу проекта (`#`) или кастомному алиасу (`@`).
  // Такие спецификаторы требуют пересчета в относительный путь.
  //
  if (!aliasPattern.test(oldPath))
    return visitChildren(this, node);

  const cachedNewPath = this.pathsCache.get(oldPath);

  const newPath = cachedNewPath === undefined
    ? resolveNewModulePath(this, oldPath)
    : cachedNewPath;

  if (cachedNewPath === undefined)
    this.pathsCache.set(oldPath, newPath);

  if (!newPath)
    return node;

  // Обновляем узел импорта новым значением пути.
  // Если путь не удалось преобразовать, возвращаем исходный узел.
  //
  return updateModuleSpecifier(this.factory, node, newPath);

}
