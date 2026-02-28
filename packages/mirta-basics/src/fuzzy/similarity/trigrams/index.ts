import { buildTrigrams } from './build';
import type { TrigramChunk } from './types';

/**
 * Вычисляет коэффициент подобия Жаккара между двумя наборами триграмм.
 *
 * Принимает:
 * - строку (`from`) → построит триграммы
 * - или уже построенные триграммы (`from`)
 *
 * @param from Исходная строка или её триграммы
 * @param to Целевая строка
 * @returns Коэффициент подобия [0..1]
 *
 * @since 0.4.0
 *
 **/
export function trigramSimilarity(from: string | Record<TrigramChunk, boolean>, to: string): number {

  let fromTrigrams: Record<TrigramChunk, boolean> = { };

  if (typeof from === 'string') {

    if (from.length === 0 || to.length === 0)
      return 0;

    if (from === to)
      return 1;

    fromTrigrams = buildTrigrams(from);

  }
  else {

    if (to.length === 0)
      return 0;

    fromTrigrams = from;

  }

  const toTrigrams = buildTrigrams(to);

  let unionScore = 0;
  let intersectionScore = 0;

  for (const trigram in fromTrigrams) {

    if (toTrigrams[trigram])
      intersectionScore++;

    unionScore++;

  }

  for (const trigram in toTrigrams) {

    if (!fromTrigrams[trigram])
      unionScore++;

  }

  if (!unionScore)
    return 0;

  return intersectionScore / unionScore;

}
