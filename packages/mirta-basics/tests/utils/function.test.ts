import { test, expect } from 'vitest'
import { debounce, throttle } from '../../src/utils/function'

test('Ensure debounced get last', () => {

  const run = debounce((value: number) => {

    expect(value).toBe(50)

  }, 2)

  run(10)
  run(20)
  run(30)
  run(40)
  run(50)

})

test('Ensure throttled get first', () => {

  let count = 0

  const run = throttle((value: number) => {

    count += value

  }, 2, { trailing: false })

  run(10) // First call within timeframe
  run(20) // Skipped
  run(30) // Skipped
  run(40) // Skipped
  run(50) // Skipped

  run.flush()

  expect(count).toBe(10)

})

test('Ensure throttled', () => {

  let count = 0

  const run = throttle((value: number) => {

    count += value

  }, 2, { trailing: false })

  run(10) // First call within timeframe
  run(20) // Skipped
  run(30) // Skipped
  run(40) // Skipped
  run(50) // Skipped

  setTimeout(() => {

    run(10) // New timeframe

  }, 4)

  setTimeout(() => {

    expect(count).toBe(20)

  }, 8)

})
