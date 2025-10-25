import { definePackageConfig } from './package'
import { defineRuntimeConfig } from './runtime'

/**
 * Основная функция для определения конфигурации на основе переданных аргументов.
 *
 * @param args Объект с аргументами командной строки Rollup.
 *             Доступные ключи:
 *             - 'config-package': активирует использование пакетной конфигурации.
 *             - 'config-skip-exports': указывает, следует ли пропустить экспорт.
 *
 * @returns Результат выполнения функции `definePackageConfig` или `defineRuntimeConfig`
 *          в зависимости от наличия флага 'config-package'.
 *
 * @since 0.3.5
 *
 **/
export default function resolveConfig(args: Record<string, unknown>) {

  // Признак использования пакетной конфигурации.
  const usePackageConfig = 'config-package' in args

  // Пропуск проверки секции экспорта.
  const skipExports = 'config-skip-exports' in args

  return usePackageConfig
    ? definePackageConfig({
        skipExports,
      })
    : defineRuntimeConfig()

}
