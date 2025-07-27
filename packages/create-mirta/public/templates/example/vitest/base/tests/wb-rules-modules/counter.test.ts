import { useCounter } from '@wbm/counter'

test('Expect counter to increment', () => {

  const counter = useCounter()
  counter.increment()

  expect(counter.count).toBe(1)

})
