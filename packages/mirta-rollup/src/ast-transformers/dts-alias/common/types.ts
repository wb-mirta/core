import ts from 'typescript';

/**
 * Перечисление типов индексных файлов.
 * Используется для классификации модулей в зависимости от их отношения к файлам `index`.
 *
 * @since 0.3.5
 *
 **/
export enum IndexType {

  /** Не индексный файл. */
  NonIndex = 'non-index',

  /** Явный индекс (например, `import './index'`). */
  Explicit = 'explicit',

  /** Неявный индекс (например, `import './dir'`). */
  Implicit = 'implicit',

  /** Индекс внутри пакета (например, import 'package/index'). */
  ImplicitPackage = 'implicit-package'
}

/**
 * Тип функции-визитора для обработки узлов AST (Abstract Syntax Tree) в TypeScript.
 * Используется для модификации или рекурсивного обхода узлов при трансформации кода.
 *
 * @since 0.3.5
 *
 **/
export type VisitorFunc = (node: ts.Node) => ts.VisitResult<ts.Node>;

/**
 * Базовый контекст для работы с AST-трансформером.
 * Содержит общие параметры и ссылки на программу TypeScript.
 *
 * @since 0.3.5
 *
 **/
export interface VisitorContextBase {

  /** Экземпляр программы TypeScript. */
  readonly program: ts.Program;

  /** Фабрика для создания/обновления узлов AST. */
  readonly factory: ts.NodeFactory;

  /** Конфигурация компилятора TypeScript. */
  readonly compilerOptions: ts.CompilerOptions;

  /** Контекст трансформации AST. */
  readonly transformationContext: ts.TransformationContext;

}

/**
 * Расширенный контекст для работы с конкретным файлом.
 * Добавляет информацию о текущем файле и директориях проекта.
 *
 * @since 0.3.5
 *
 **/
export interface VisitorContext extends VisitorContextBase {

  /** Текущий обрабатываемый файл. */
  readonly sourceFile: ts.SourceFile;

  /** Корневая директория проекта. */
  readonly rootDir: string;

  /** Кэш путей импорта/экспорта. */
  readonly pathsCache: Map<string, string | null>;

  /** Кэш файлов по имени без расширения. */
  sourceFilesCache?: Map<string, ts.SourceFile>;

  /** Возвращает функцию-визитор для обработки AST. */
  getVisitor(this: VisitorContext): VisitorFunc;

}
