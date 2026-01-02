vi.mock('#wbm/counter-store', () => {

  const mockStore = {
    count: 0,
    double: 0,
    increment: vi.fn(),
    setCount: vi.fn(),
  }

  return {
    useCounterStore: () => mockStore,
  }

})

import { useCounter } from '#wbm/counter'
import { useCounterStore } from '#wbm/counter-store'

describe('useCounter', () => {

  it('should read count from store', () => {

    // Arrange
    const store = useCounterStore()
    store.count = 42

    // Act
    const counter = useCounter()

    // Assert
    expect(counter.count).toBe(42)

  })

  it('should call store.increment when increment is called', () => {

    // Arrange
    const store = useCounterStore()
    const counter = useCounter()

    // Act
    counter.increment()

    // Assert
    expect(store.increment).toHaveBeenCalledOnce()

  })

  it('should reflect updated store state', () => {

    // Arrange
    const store = useCounterStore()
    const counter = useCounter()

    // Act
    store.count = 10

    // Assert
    expect(counter.count).toBe(10)

  })

})
