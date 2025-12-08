import { damerauLevenshtein } from './edit-distance/damerau-levenshtein'

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
   * Флаг, указывающий, следует ли игнорировать регистр символов
   * при сравнении строк.
   *
   * Полезно в CLI-интерфейсах, где пользователь может вводить команды
   * в любом регистре.
   *
   **/
  ignoreCase?: boolean

}

/**
 * Предлагает наиболее близкое значение из списка допустимых,
 * используя алгоритм Дамерау-Левенштейна для учёта опечаток.
 *
 * Функция предназначена для реализации подсказок вроде:
 * "Вы имели в виду 'release'?", когда пользователь ввёл 'releas'.
 *
 * @param input Введённая пользователем строка, возможно, с опечаткой
 * @param knownValues Список корректных, допустимых значений (например, команды, флаги)
 * @param options Настройки нечёткого поиска
 * @returns Наиболее близкое значение из `knownValues` или `undefined`, если совпадений нет
 *
 * @example
 * ```ts
 * suggestClosest('releas', ['release', 'publish']) // → 'release'
 * suggestClosest('релиз', ['release', 'publish'])  // → undefined
 * ```
 * @example С игнорированием регистра
 * ```ts
 * suggestClosest('RELEASE', ['release'], { ignoreCase: true }) // → 'release'
 * ```
 * @since 0.4.0
 */
export function suggestClosest(
  input: string,
  knownValues: readonly string[],
  options: SuggestOptions = {}
): string | undefined {

  const { maxDistance = 2, ignoreCase = false } = options

  if (ignoreCase) {

    input = input.toLowerCase()
    knownValues = knownValues.map(value => value.toLowerCase())

  }

  const closest = knownValues
    .map(value => ({ value, distance: damerauLevenshtein(input, value).steps }))
    .filter(item => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)

  return closest[0]?.value

}
