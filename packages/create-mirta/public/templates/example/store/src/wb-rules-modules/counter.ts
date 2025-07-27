import { useCounterStore } from '@wbm/counter-store'

const store = useCounterStore()

export function useCounter() {

  return {
    get count() {

      return store.count

    },
    increment() {

      store.count += 1

    },
  }

}
