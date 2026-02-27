import { useCounterStore } from '#wbm/counter-store';

/**
 * Простой счётчик с возможностью инкремента и чтения текущего значения
 *
 **/
export interface Counter {

  /** Позволяет прочесть значение счётчика. */
  get count(): number;

  /** Увеличивает значение счётчика на единицу. */
  increment(): void;

}

/**
 * Функция-построитель простого счётчика
 *
 * @returns Экземпляр счётчика
 *
 **/
export function useCounter(): Counter {

  // Значение счётчика - глобальное состояние
  const store = useCounterStore();

  return {

    get count() {

      return store.count;

    },

    increment() {

      store.increment();

    },

  };

}
