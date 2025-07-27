import { test, expect } from 'vitest'
import { defineStore } from '../src'

test('Reuse existing state', () => {

  // Экспортируемая константа useStore,
  // размещаемая в каком-нибудь модуле.
  const useStore = defineStore('testStore', {
    state: () => ({
      count: 0,
    }),
  })

  const store1 = useStore()
  const store2 = useStore()

  store1.count += 10

  // Оба экземпляра ссылаются на один и тот же инстанс,
  // что делает возможным вызов useStore() в разных
  // модулях и скриптах правил.
  expect(store1.count).toBe(10)

  store2.count += 20

  expect(store1.count).toBe(30)

  // Возврат к исходному состоянию.
  store1.$reset()

  expect(store1.count).toBe(0)

})
