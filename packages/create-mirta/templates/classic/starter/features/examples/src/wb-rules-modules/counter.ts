/**
 * Простой счётчик с возможностью инкремента и чтения текущего значения
 *
 **/
export interface Counter {

  /** Позволяет прочесть значение счётчика. */
  get count(): number

  /** Увеличивает значение счётчика на единицу. */
  increment(): void

}

/**
 * Функция-построитель простого счётчика
 *
 * @returns Экземпляр счётчика
 *
 **/
export function useCounter(): Counter {

  // Значение счётчика - его индивидуальное состояние
  let count = 0

  return {

    get count() {

      return count

    },

    increment() {

      count += 1

    }

  }

}
