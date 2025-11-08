/**
 * Путь внутри поля `exports` (например, `"./dist/index.mjs"`).
 *
 * Может быть строкой, `null` или `undefined`.
 *
 * @since 0.4.0
 *
 **/
export type ExportsPath = string | null | undefined

/**
 * Объект с `types` и `default` внутри поля `exports`.
 *
 * Определяет альтернативные пути для условия `import`.
 *
 * @example
 *
 * ```json
 * {
 *   "import": {
 *     "types": "./dist/index.d.mts",
 *     "default": "./dist/index.mjs"
 *   }
 * }
 *
 * ```
 * @since 0.4.0
 *
 **/
export interface ExportsObject {

  /** Путь к файлу типов (`.d.mts`). */
  types?: ExportsPath

  /** Основной путь экспорта. */
  default?: ExportsPath

}

/**
 * Упрощённая форма условного экспорта, поддерживаемая фреймворком Мирта.
 *
 * Поддерживается только условие `import`.
 * Другие условия (`require`, `node`, `browser`) игнорируются.
 *
 * @example
 *
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "import": "./dist/index.mjs"
 *     }
 *   }
 * }
 *
 * ```
 * @example
 *
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "import": {
 *         "types": "./dist/index.d.mts",
 *         "default": "./dist/index.mjs"
 *       }
 *     }
 *   }
 * }
 *
 * ```
 *
 * @since 0.4.0
 *
 **/
export interface ExportsConditional {

  /**
   * Путь или объект экспорта для условной загрузки.
   *
   * @remarks
   * Условие `import` — единственный поддерживаемый вариант в Мирте.
   *
   **/
  import: ExportsPath | ExportsObject
}

/**
 * Любой допустимый тип в записи поля `exports`.
 * Может быть строкой, объектом или условным экспортом.
 *
 * @since 0.4.0
 *
 **/
export type ExportsEntry = ExportsPath | ExportsConditional | ExportsObject

/**
 * Упрощённая форма поля `exports` из package.json, поддерживаемая фреймворком Мирта.
 *
 * Поддерживает:
 * - Простые пути: `"import": "./dist/index.mjs"`;
 * - Объекты с `types` и `default`;
 * - Дополнительные точки входа (например, `./setup-global`, `./context`).
 *
 * @example
 *
 * ```json
 * {
 *   "exports": {
 *     ".": {
 *       "import": "./dist/index.mjs"
 *     }
 *   }
 * }
 * ```
 * @since 0.4.0
 *
 **/
export type PackageExports = ExportsPath | ExportsConditional | Record<string, ExportsEntry>

/**
 * Минимальный контракт `package.json`, необходимый для работы фреймворка Мирта.
 *
 * @since 0.4.0
 *
 **/
export interface Package {

  /**
   * Имя пакета (например, `"@mirta/package"`).
   *
   **/
  name?: string

  /**
   * Конфигурация экспорта модуля.
   *
   * Поддерживается упрощённый формат с условием `import`.
   *
   **/
  exports?: PackageExports

  /**
   * Список шаблонов рабочих пространств (workspaces).
   * Используется для определения структуры монорепозитория.
   *
   **/
  workspaces?: string[]

}
