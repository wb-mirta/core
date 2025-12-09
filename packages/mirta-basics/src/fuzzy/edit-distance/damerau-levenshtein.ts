import type { EditDistanceResult } from './types'

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
function normalizeDistance(steps: number, length: number): EditDistanceResult {

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
 * Поддерживает:
 * - Вставку
 * - Удаление
 * - Замену
 * - Транспозицию (перестановку соседних символов)
 *
 * Использует `limit` для оптимизации: матрица ограничена, ранний выход.
 *
 * @param source Первая строка
 * @param target Вторая строка
 * @param maxDistance Максимальное расстояние для расчёта (по умолчанию — max(len) + 1)
 *
 * @since 0.4.0
 *
 **/
export function damerauLevenshtein(source: string, target: string, maxDistance?: number): EditDistanceResult {

  const lenA = source.length
  const lenB = target.length

  const maxLength = Math.max(lenA, lenB)

  // Автоматический лимит
  const effectiveLimit = maxDistance ?? maxLength + 1

  // Ранний выход: если разница в длинах больше limit
  if (Math.abs(lenA - lenB) > effectiveLimit)
    return normalizeDistance(effectiveLimit, maxLength)

  if (lenA === 0)
    return normalizeDistance(lenB, maxLength)

  if (lenB === 0)
    return normalizeDistance(lenA, maxLength)

  // Создаём матрицу размером (lenA + 1) × (lenB + 1), но заполняем только в пределах effectiveLimit
  const matrix = createMatrix(lenA, lenB, Infinity)

  for (let i = 0; i <= lenA; i++)
    matrix[i][0] = i

  for (let j = 0; j <= lenB; j++)
    matrix[0][j] = j

  for (let i = 1; i <= lenA; i++) {

    // Оптимизация: можно ограничить j по диапазону [i - effectiveLimit, i + effectiveLimit]
    const jStart = Math.max(1, i - effectiveLimit)
    const jEnd = Math.min(lenB, i + effectiveLimit)

    for (let j = jStart; j <= jEnd; j++) {

      const cost = source[i - 1] === target[j - 1] ? 0 : 1

      let min = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )

      // Транспозиция: перестановка двух соседних символов
      if (
        i > 1
        && j > 1
        && source[i - 1] === target[j - 2]
        && source[i - 2] === target[j - 1]
      ) {

        const transposition = matrix[i - 2][j - 2] + 1
        if (transposition < min) {

          min = transposition

        }

      }

      matrix[i][j] = min

    }

  }

  const steps = matrix[lenA][lenB]

  return normalizeDistance(steps, maxLength)

}
