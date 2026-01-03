import { useCounter } from '#wbm/counter'

describe('Counter', () => {

  let counter: ReturnType<typeof useCounter>

  beforeEach(() => {

    counter = useCounter()

  })

  it('should start with count equal to 0', () => {

    expect(counter.count).toBe(0)

  })

  it('should increment count by 1 when increment is called', () => {

    counter.increment()
    expect(counter.count).toBe(1)

    counter.increment()
    expect(counter.count).toBe(2)

  })

  it('should not allow direct modification of count', () => {

    const initial = counter.count

    // @ts-expect-error – подавляем ошибку этапа компиляции
    counter.count = 100

    // Значение не должно измениться
    expect(counter.count).toBe(initial)

  })

  it('should have independent state for each instance', () => {

    const counter1 = useCounter()
    const counter2 = useCounter()

    counter1.increment()
    counter1.increment()

    counter2.increment()

    expect(counter1.count).toBe(2)
    expect(counter2.count).toBe(1)

  })

})
