import { INPUT_LENGTH_THRESHOLD } from './constants'
import type { DistanceResult } from './types'

/**
 * Нормализует абсолютное расстояние редактирования в относительные метрики.
 *
 * @param steps - Количество шагов
 * @param length - Длина строки
 * @returns Относительное расстояние
 *
 * @since 0.4.0
 *
 **/
function normalizeDistance(steps: number, length: number): DistanceResult {

  const relative = length === 0 ? 0 : steps / length

  const similarity = 1 - relative

  return { steps, relative, similarity }

}

/**
 * Создаёт матрицу размером `(sizeX + 1) × (sizeY + 1)`.
 *
 * @param sizeX - Размер по оси X
 * @param sizeY - Размер по оси Y
 * @param defaultValue - Значение по умолчанию
 * @returns Матрица
 *
 * @since 0.4.0
 *
 **/
function createMatrix(
  sizeX: number,
  sizeY: number,
  defaultValue: number
): number[][] {

  const matrix = new Array<number[]>(sizeX + 1)

  for (let i = 0; i <= sizeX; i++) {

    const row = new Array<number>(sizeY + 1)

    for (let j = 0; j <= sizeY; j++) {

      row[j] = defaultValue

    }
    matrix[i] = row

  }

  return matrix

}

/**
 * Вычисляет расстояние Дамерау-Левенштейна между двумя строками.
 *
 * Сложность: `O(n × m)` 💥 Экспоненциальный рост.
 *
 * @param from Первая строка
 * @param to Вторая строка
 * @param maxDistance Максимальное расстояние для расчёта.
 *                    Если превышено, расстояние возвращается как `Infinity`.
 *
 * @since 0.4.0
 *
 **/
export function damerauLevenshtein(
  from: string,
  to: string,
  maxDistance?: number
): DistanceResult {

  const lenFrom = from.length
  const lenTo = to.length

  // Предотвращает перегрузку памяти, если строки слишком длинные.
  if (lenFrom > INPUT_LENGTH_THRESHOLD || lenTo > INPUT_LENGTH_THRESHOLD)
    return { steps: Infinity, relative: Infinity, similarity: -Infinity }

  const maxLength = Math.max(lenFrom, lenTo)

  // Эффективный лимит: если maxDistance не задан, используем maxLength + 1
  const effectiveLimit = maxDistance ?? maxLength + 1

  // Ранний выход: если разница в длинах больше limit
  if (Math.abs(lenFrom - lenTo) > effectiveLimit)
    return { steps: Infinity, relative: Infinity, similarity: -Infinity }

  if (lenFrom === 0)
    return lenTo > effectiveLimit
      ? { steps: Infinity, relative: Infinity, similarity: -Infinity }
      : normalizeDistance(lenTo, maxLength)

  if (lenTo === 0)
    return lenFrom > effectiveLimit
      ? { steps: Infinity, relative: Infinity, similarity: -Infinity }
      : normalizeDistance(lenFrom, maxLength)

  // Создаём и заполняем матрицу размером (lenFrom + 1) × (lenTo + 1)

  const matrix = createMatrix(lenFrom, lenTo, Infinity)

  for (let i = 0; i <= lenFrom; i++)
    matrix[i][0] = i

  for (let j = 0; j <= lenTo; j++)
    matrix[0][j] = j

  for (let i = 1; i <= lenFrom; i++) {

    // Оптимизация: рассматриваем только ячейки в пределах возможного расстояния

    const jStart = Math.max(1, i - effectiveLimit)
    const jEnd = Math.min(lenTo, i + effectiveLimit)

    for (let j = jStart; j <= jEnd; j++) {

      const cost = from[i - 1] === to[j - 1] ? 0 : 1

      let min = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )

      // Транспозиция: перестановка двух соседних символов

      if (
        i > 1
        && j > 1
        && from[i - 1] === to[j - 2]
        && from[i - 2] === to[j - 1]
      ) {

        const transposition = matrix[i - 2][j - 2] + 1

        if (transposition < min)
          min = transposition

      }

      matrix[i][j] = min

    }

  }

  const steps = matrix[lenFrom][lenTo]

  // Если задан maxDistance и фактическое расстояние превышает его,
  // считаем строки "слишком далёкими" и возвращаем Infinity.
  //
  if (maxDistance !== undefined && steps > maxDistance)
    return { steps: Infinity, relative: Infinity, similarity: -Infinity }

  return normalizeDistance(steps, maxLength)

}
