import { type TransformerFactory } from '@rollup/plugin-typescript';

import { dtsAliasTransformerFactory } from './ast/transformer';

/**
 * Экспортируемый трансформер для Rollup, предназначенный для обработки файлов объявлений TypeScript (`.d.ts`).
 * Используется в фазе `afterDeclarations`, чтобы корректировать пути импортов после генерации типов.
 *
 * @returns Объект трансформера, который может быть передан в конфигурацию Rollup.
 *
 * @example
 * Пример использования в конфигурации Rollup:
 * ```ts
 * import { dtsAlias } from '#ast/dts-alias';
 *
 * export default {
 *   plugins: [
 *     typescript({
 *       transformers: {
 *         afterDeclarations: [
 *           dtsAlias()
 *         ]
 *       }
 *     })
 *   ]
 * }
 *
 * ```
 * @since 0.3.5
 *
 **/
export const dtsAlias = (): TransformerFactory<'afterDeclarations'> => ({

  type: 'program',
  factory: dtsAliasTransformerFactory,

});
