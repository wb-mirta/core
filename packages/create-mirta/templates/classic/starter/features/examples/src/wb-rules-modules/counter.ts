/**
 * Простой счётчик с возможностью инкремента,
 * декремента, сброса и чтения текущего значения.
 *
 **/
export interface Counter {

  /** Позволяет прочесть значение счётчика. */
  count: number;

  /** Увеличивает значение счётчика на единицу. */
  increment(): void;

  /** Уменьшает значение счётчика на единицу. */
  decrement(): void;

  /** Сбрасывает счётчик к исходному значению. */
  reset(): void;

}

/**
 * Функция-построитель простого счётчика
 *
 * @returns Экземпляр счётчика
 *
 **/
export function useCounter(): Counter {

  const initialCount = 0;

  return {

    // Значение счётчика - его индивидуальное состояние
    count: initialCount,

    increment() {

      this.count += 1;

    },

    decrement() {

      this.count -= 1;

    },

    reset() {

      this.count = initialCount;

    },

  };

}
