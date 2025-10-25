import { definePackageConfig } from './package'
import { defineRuntimeConfig } from './runtime'

/**
 * Основная функция для определения конфигурации на основе переданных аргументов.
 *
 * @param args Объект с аргументами, где ключи и значения являются строками.
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
export default function (args: Record<string, string>) {

  // Признак использования пакетной конфигурации.
  const usePackageConfig = Object.keys(args)
    .includes('config-package')

  // Пропуск проверки секции экспорта.
  const skipExports = Object.keys(args)
    .includes('config-skip-exports')

  return usePackageConfig
    ? definePackageConfig({
        skipExports,
      })
    : defineRuntimeConfig()

}
