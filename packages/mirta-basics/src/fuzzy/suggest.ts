import { damerauLevenshtein } from './distance/damerau-levenshtein'
import { daitchMokotoffLite } from './phonetics/daitch-mokotoff'
import { trigramSimilarity } from './similarity'
import { translit } from '#src/fuzzy/translit'
import { buildTrigrams } from './similarity/trigrams/build'

/**
 * Параметры для работы с функцией {@link suggestClosest} — нечёткого поиска
 * наиболее подходящего значения на основе ввода пользователя.
 *
 * Используется для настройки чувствительности и поведения при сравнении строк.
 *
 * @since 0.4.0
 *
 **/
export interface SuggestOptions {

  /**
   * Максимальное расстояние Дамерау-Левенштейна, при котором значение
   * считается допустимым кандидатом для подсказки. По умолчанию — `2`.
   *
   * Чем меньше значение, тем строже сравнение.
   *
   **/
  maxDistance?: number

  /**
   * Веса для комбинированного ранжира.
   * Сумма не обязана быть 1 — нормализуется внутри.
   */
  weights?: {
    phonetic?: number
    trigram?: number
    levenshtein?: number
  }

}

interface Candidate {

  value: string
  valueNorm: string
  phonetic: string
  triScore: number

}

const normalize = (input: string) => translit(input.toUpperCase())

function sumWeights(weights: SuggestOptions['weights'] = {}) {

  return (weights.phonetic ?? 0) + (weights.trigram ?? 0) + (weights.levenshtein ?? 0)

}

/**
 * Предлагает наиболее близкое значение из списка допустимых,
 * используя алгоритм Дамерау-Левенштейна для учёта опечаток.
 *
 * Функция предназначена для реализации подсказок вроде:
 * "Вы имели в виду 'release'?", когда пользователь ввёл 'releas'.
 *
 * @param input Введённая пользователем строка, возможно, с опечаткой
 * @param targetValues Список корректных, допустимых значений (например, команды, флаги)
 * @param options Настройки нечёткого поиска
 * @returns Наиболее близкое значение из `knownValues` или `undefined`, если совпадений нет
 *
 * @example
 * ```ts
 * suggestClosest('releas', ['release', 'publish']) // → 'release'
 * suggestClosest('релиз', ['release', 'publish'])  // → 'release'
 * ```
 * @since 0.4.0
 *
 **/
export function suggestClosest(
  input: string,
  targetValues: readonly string[],
  options: SuggestOptions = {}
): string | undefined {

  const {
    maxDistance = 2,
    weights = { phonetic: 0.5, trigram: 0.3, levenshtein: 0.2 },
  } = options

  const inputNorm = normalize(input)

  let candidates: Candidate[] = []

  if (!inputNorm)
    return undefined

  for (const value of targetValues) {

    // Ранний выход - прямое соответствие.
    if (input === value)
      return value

    const valueNorm = normalize(value)

    // Ранний выход - прямое соответствие.
    if (inputNorm === valueNorm)
      return value

    candidates.push({
      value: value,
      valueNorm: valueNorm,
      phonetic: daitchMokotoffLite(value),
      triScore: 0,
    })

  }

  // Предвычисляем фонетический код и триграммы для ввода
  const inputPhonetic = daitchMokotoffLite(input)
  const inputTrigrams = buildTrigrams(inputNorm)

  const phoneticCandidates = candidates.filter(c => c.phonetic === inputPhonetic)

  // Замена кандидатов на фонетические, если есть прямые совпадения
  // Если нет фонетических совпадений — используем все
  //
  if (phoneticCandidates.length > 0)
    candidates = phoneticCandidates

  candidates = candidates.map((c) => {

    c.triScore = trigramSimilarity(inputTrigrams, c.valueNorm)

    return c

  })

  const top10 = candidates
    .sort((a, b) => b.triScore - a.triScore)
    .slice(0, 10)

  const totalWeight = sumWeights(weights)
  const normWeight = (weight: number | undefined) => (totalWeight === 0 ? 0 : (weight ?? 0) / totalWeight)

  let bestScore = -1
  let bestValue: string | undefined

  for (const candidate of top10) {

    const { similarity: levScore } = damerauLevenshtein(
      inputNorm,
      candidate.valueNorm,
      maxDistance
    )

    if (levScore <= 0)
      continue // Пропускаем, если расстояние слишком большое.

    const phoneticScore = candidate.phonetic === inputPhonetic ? 1 : 0

    const score
      = phoneticScore * normWeight(weights.phonetic)
        + candidate.triScore * normWeight(weights.trigram)
        + levScore * normWeight(weights.levenshtein)

    if (score > bestScore) {

      bestScore = score
      bestValue = candidate.value

    }

  }

  return bestValue

}
