import { test, expect } from 'vitest'
import { useEvent } from '../src/event'

test('Handle once do not break other handlers', () => {

  let count = 0
  const counterEvent = useEvent()

  counterEvent.once(() => {

    count += 1

  })

  counterEvent.on(() => {

    count += 1

  })

  counterEvent.on(() => {

    count += 1

  })

  counterEvent.raise()

  expect(count).toBe(3)

})
