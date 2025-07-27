import { defineStore } from '@mirta/store'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
})
