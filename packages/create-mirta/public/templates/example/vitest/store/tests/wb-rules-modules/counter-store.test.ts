import { useCounterStore } from '@wbm/counter-store'

test('Expect state is shared', () => {

  const storeA = useCounterStore()
  const storeB = useCounterStore()

  const value = 10
  storeA.count += value

  expect(storeB.count).toBe(value)

})
