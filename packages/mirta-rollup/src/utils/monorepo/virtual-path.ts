import nodePath from 'node:path';

import type { PackageDefinition } from '@mirta/workspace';
import { BuildError } from '../errors';

/**
 * Преобразует имя чанка в путь, имитирующий установленный пакет в `node_modules`.
 *
 * Позволяет обрабатывать импорты из других пакетов монорепозитория
 * наравне с установленными зависимостями.
 *
 * @param chunkName - Путь к файлу от корня монорепозитория в формате POSIX (и без расширения).
 * @param pkgDefinition - Пакет, которому принадлежит файл.
 * @returns Виртуальный путь вида `node_modules/<имя-пакета>/<относительный-путь>`.
 *
 * @example
 * ```ts
 * toVirtualModulePath('packages/mirta-home/dist/heater', {
 *   name: '@mirta/home',
 *   workspacePath: 'packages/mirta-home'
 * })
 * // → 'node_modules/@mirta/home/dist/heater'
 * ```
 * @since 0.4.0
 *
 **/
export function toVirtualModulePath(chunkName: string, pkgDefinition: PackageDefinition) {

  const relativePath = nodePath.posix.relative(pkgDefinition.workspacePath, chunkName);

  // Проверяем, что путь не выходит за пределы пакета.
  if (relativePath.startsWith('..'))
    throw BuildError.get(
      'chunkOutsidePackage',
      chunkName,
      pkgDefinition.name,
      pkgDefinition.workspacePath
    );

  return `node_modules/${pkgDefinition.name}/${relativePath}`;

}
