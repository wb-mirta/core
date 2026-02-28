import { definePackageConfig } from '#configs/package';

/**
 * Конфигурация Rollup по умолчанию, предназначенная
 * для сборки распространяемых через NPM пакетов.
 *
 * @param args Объект с аргументами командной строки Rollup.
 *             Доступные ключи:
 *             - `--config-skip-exports` - пропускает валидацию соответствия между входными файлами и секцией `exports` в `package.json`.
 *
 * @returns Результат выполнения функции `definePackageConfig`
 *
 * @since 0.4.0
 *
 **/
export default function resolveConfig(args: Record<string, unknown>) {

  // Пропуск проверки секции экспорта.
  const skipExports = args['config-skip-exports'] === true;

  return definePackageConfig({
    skipExports,
  });

}
