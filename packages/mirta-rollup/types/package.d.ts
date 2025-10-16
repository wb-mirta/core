/**
 * Пространство имен для типов, связанных с конфигурацией экспорта из package.json.
 *
 * @since 0.3.5
 *
 **/
declare namespace PackageExports {

  /**
   * Тип, представляющий путь к файлу. Может быть строкой, null или undefined.
   *
   * @since 0.3.5
   *
   **/
  type Path = string | null | undefined

  /**
   * Интерфейс, описывающий объект экспорта с опциональными полями `types` и `default`.
   *
   * @since 0.3.5
   *
   **/
  interface EntryObject {
    /** Путь к файлу типов (`.d.ts`). */
    types?: Path
    /** Путь к основному файлу экспорта (по умолчанию). */
    default?: Path
  }

  /**
   * Интерфейс условного экспорта, содержащий поле `import`.
   *
   * @since 0.3.5
   *
   **/
  interface ConditionalEntry {

    /** Путь или объект экспорта для условной загрузки. */
    import: Path | EntryObject
  }

  /**
   * Объединение всех возможных типов экспорта.
   * Может быть строкой, условным экспортом или объектом с полями.
   *
   * @since 0.3.5
   *
   **/
  type Entry = Path | ConditionalEntry | EntryObject
}

/**
 * Тип, описывающий структуру конфигурации экспорта из package.json.
 * Может быть строкой, условным экспортом или объектом с ключами и значениями.
 *
 * @since 0.3.5
 *
 **/
type PackageExports
  = PackageExports.Path
    | PackageExports.ConditionalEntry
    | Record<string, PackageExports.Entry>

/**
 * Интерфейс, представляющий минимальную структуру файла package.json.
 *
 * @since 0.3.5
 *
 **/
interface Package {

  /**
   * Конфигурация экспорта модуля, определённая в поле `exports` файла package.json.
   *
   **/
  exports: PackageExports

}
