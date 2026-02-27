import nodePath from 'node:path';
import { defineConfig, configDefaults, type TestProjectConfiguration } from 'vitest/config';
import { resolveMonorepoContextAsync } from '@mirta/workspace';
import { loadEnv } from '@mirta/env-loader';

const cwd = process.cwd();
const { rootDir, packages } = await resolveMonorepoContextAsync(cwd);

/**
 * Формирует конфигурации проектов Vitest для каждого пакета монорепозитория в соответствии с указанным режимом.
 *
 * @param mode - Режим окружения, передаваемый в загрузчик переменных окружения (`loadEnv`) для каждой конфигурации
 * @returns Массив конфигураций `TestProjectConfiguration` для каждого пакета, или `undefined`, если пакетов нет
 */
function getProjects(mode: string) {

  if (packages.length === 0)
    return;

  return packages.map<TestProjectConfiguration>(pkg => ({
    extends: true,
    root: pkg.workspacePath,
    test: {
      env: loadEnv({
        mode,
        // Поиск только в пакете, чтобы не дублировать.
        cwd: nodePath.join(rootDir, pkg.workspacePath),
      }),
      name: pkg.name,
      typecheck: {
        enabled: true,
      },
    },
  }));

}

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: true,
    __TEST__: true,
  },
  resolve: {
    // По умолчанию vite:import-analysis ищет точки входа
    // пакетов в секции exports соответствующего файла package.json,
    // однако тесты должны выполняться до сборки.
    //
    // Здесь осуществляется перенаправление на src/index.ts
    alias: packages.reduce<Record<string, string>>((items, nextItem) => {

      items[nextItem.name] = nodePath.join(rootDir, nextItem.workspacePath, 'src');

      return items;

    }, {}),
  },
  test: {
    environment: 'node',
    globals: true,
    isolate: !!process.env.CI,
    watch: false,
    exclude: [
      ...configDefaults.exclude,
      '**/templates/**',
      '**/dist/**',
    ],
    env: loadEnv({
      mode,
      cwd,
      rootDir,
    }),
    setupFiles: [
      '@mirta/testing/setup-global',
    ],
    projects: getProjects(mode),
  },
}));
