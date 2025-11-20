import { StoreError } from '#src/errors/store-error'
import { defineStore, __resetInternalState } from '#src/store'

beforeEach(() => {

  __resetInternalState()

})

describe('defineStore', () => {

  it('should create a store with state, getters, and actions', () => {

    const useCounter = defineStore('counter', {
      state: () => ({
        count: 0,
        name: 'Test',
      }),
      getters: {
        double: state => state.count * 2,
        labeled: state => `${state.name}: ${state.count}`,
      },
      actions: {
        increment() {

          this.count++

        },
        setCount(value: number) {

          this.count = value

        },
      },
    })

    const store = useCounter()

    expect(store.count).toBe(0)
    expect(store.double).toBe(0)
    expect(store.labeled).toBe('Test: 0')

    store.increment()
    expect(store.count).toBe(1)
    expect(store.double).toBe(2)

    store.setCount(5)
    expect(store.count).toBe(5)
    expect(store.labeled).toBe('Test: 5')

  })

  it('should support this in getters', () => {

    const useProduct = defineStore('product', {
      state: () => ({
        price: 100,
        tax: 20,
      }),
      getters: {
        priceWithTax(): number {

          return this.price * (1 + this.tax / 100)

        },
        total(): number {

          return this.priceWithTax + 10

        },
      },
      actions: {
        applyDiscount(percent: number) {

          this.price = this.price * (1 - percent / 100)

        },
      },
    })

    const store = useProduct()

    expect(store.priceWithTax).toBe(120)
    expect(store.total).toBe(130)

    store.applyDiscount(10)

    expect(store.price).toBe(90)
    expect(store.priceWithTax).toBeCloseTo(108)
    expect(store.total).toBeCloseTo(118)

  })

  it('should support $patch with partial state', () => {

    const useUser = defineStore('user', {
      state: () => ({
        name: 'Alice',
        age: 25,
        address: { city: 'Moscow', zip: '123456' },
      }),
      getters: {
        intro: state => `${state.name}, ${state.age}`,
      },
      actions: {
        rename(name: string) {

          this.name = name

        },
      },
    })

    const store = useUser()

    store.$patch({ name: 'Bob', age: 30 })

    expect(store.name).toBe('Bob')
    expect(store.age).toBe(30)
    expect(store.intro).toBe('Bob, 30')

  })

  it('should support $patch with state mutator function', () => {

    const useCounter = defineStore('counterPatch', {
      state: () => ({ count: 0 }),
    })

    const store = useCounter()

    store.$patch((state) => {

      state.count += 5
      state.count *= 2

    })

    expect(store.count).toBe(10)

  })

  it('should support $reset to initial state', () => {

    const useSettings = defineStore('settings', {
      state: () => ({
        volume: 50,
        mute: false,
        theme: 'dark' as 'light' | 'dark',
      }),
      actions: {
        toggleMute() {

          this.mute = !this.mute

        },
      },
    })

    const store = useSettings()

    store.volume = 80
    store.mute = true
    store.theme = 'light'

    expect(store.volume).toBe(80)
    expect(store.mute).toBe(true)
    expect(store.theme).toBe('light')

    store.$reset()

    expect(store.volume).toBe(50)
    expect(store.mute).toBe(false)
    expect(store.theme).toBe('dark')

  })

  it('should share state between instances via module.static', () => {

    const useShared = defineStore('shared', {
      state: () => ({ value: 0 }),
      actions: {
        increment() {

          this.value++

        },
      },
    })

    const storeA = useShared()
    const storeB = useShared()

    expect(storeA.value).toBe(0)
    expect(storeB.value).toBe(0)

    storeA.increment()

    expect(storeA.value).toBe(1)
    expect(storeB.value).toBe(1) // Shared state

  })

  it('should support named instances (useStore(id))', () => {

    const useSensor = defineStore('sensor', {
      state: () => ({ temperature: 0 }),
      actions: {
        set(temp: number) {

          this.temperature = temp

        },
      },
    })

    const sensor1 = useSensor('living-room')
    const sensor2 = useSensor('kitchen')

    sensor1.set(22)
    sensor2.set(25)

    expect(sensor1.temperature).toBe(22)
    expect(sensor2.temperature).toBe(25)

    // Check isolation
    const sensor1b = useSensor('living-room')
    expect(sensor1b.temperature).toBe(22)

  })

  it('should throw on duplicate typeId', () => {

    defineStore('unique', {
      state: () => ({}),
    })

    expect(() => {

      defineStore('unique', {
        state: () => ({}),
      })

    }).toThrow(StoreError.get('alreadyDefined', 'unique'))

  })

  it('should expose $typeId on useStore', () => {

    const useTest = defineStore('testName', {
      state: () => ({}),
    })

    expect(useTest.$typeId).toBe('testName')

  })

})
