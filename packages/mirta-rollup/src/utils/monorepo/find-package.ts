import type { MonorepoContext, PackageDefinition } from '@mirta/workspace'

/**
 * Находит пакет, которому принадлежит указанный чанк.
 *
 * Поиск выполняется по префиксу пути: первый пакет, чей `workspacePath`
 * является началом `chunkName`, считается владельцем.
 *
 * @param context - Контекст монорепозитория.
 * @param chunkName - Имя чанка, предоставляемое Rollup (`chunk.name`).
 * @returns Объект {@link PackageDefinition} или `undefined`, если пакет не найден.
 *
 * @since 0.4.0
 *
 **/
export function findPackageByChunkName(
  context: MonorepoContext,
  chunkName: string
): PackageDefinition | undefined {

  for (const pkg of context.packages) {

    if (chunkName.startsWith(pkg.workspacePath + '/'))
      return pkg

  }

}
