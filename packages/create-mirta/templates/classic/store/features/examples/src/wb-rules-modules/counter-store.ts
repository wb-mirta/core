import { defineStore } from '@mirta/store';

export const useCounterStore = defineStore('counter', {

  state: () => ({

    count: 0,

  }),

  getters: {

    double: state => state.count * 2,

  },

  actions: {

    increment() {

      this.count++;

    },

    setCount(value: number) {

      this.count = value;

    },

  },

});
