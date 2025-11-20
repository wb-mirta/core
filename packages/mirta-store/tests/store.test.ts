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

  it('should perform deep merge with $patch', () => {

    const useSettings = defineStore('settings', {
      state: () => ({
        user: {
          profile: {
            name: 'Alice',
            age: 25,
          },
          preferences: {
            theme: 'dark',
            lang: 'en',
          },
        },
        notifications: {
          email: true,
          push: false,
        },
      }),
    })

    const store = useSettings()

    // Deep patch should merge nested objects, not replace them
    store.$patch({
      user: {
        profile: {
          age: 26,
        },
      },
    })

    expect(store.user.profile.name).toBe('Alice') // Preserved
    expect(store.user.profile.age).toBe(26) // Updated
    expect(store.user.preferences.theme).toBe('dark') // Preserved

    store.$patch({
      notifications: {
        push: true,
      },
    })

    expect(store.notifications.email).toBe(true) // Preserved
    expect(store.notifications.push).toBe(true) // Updated

  })

  it('should support $reset to initial state', () => {

    const useSettings = defineStore('resetSettings', {
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

  // New tests below

  it('should support nullish coalescing with undefined state properties', () => {

    const useConfig = defineStore('config', {
      state: () => ({
        port: undefined as number | undefined,
        host: undefined as string | undefined,
      }),
    })

    const store = useConfig()

    // Test nullish coalescing operator
    const port = store.port ?? 3000
    const host = store.host ?? 'localhost'

    expect(port).toBe(3000)
    expect(host).toBe('localhost')

    // Update and retest
    store.port = 8080

    expect(store.port).toBe(8080)

  })

  it('should support nullish coalescing with null state properties', () => {

    const useData = defineStore('data', {
      state: () => ({
        value: null as number | null,
        label: null as string | null,
      }),
    })

    const store = useData()

    expect(store.value ?? 42).toBe(42)
    expect(store.label ?? 'default').toBe('default')

    store.value = 100 as number | null
    store.label = 'custom' as string | null

    expect(store.value ?? 42).toBe(100)
    expect(store.label ?? 'default').toBe('custom')

    store.value = null as number | null
    expect(store.value ?? 42).toBe(42)

  })

  it('should handle nullish coalescing with getters', () => {

    const useOptional = defineStore('optional', {
      state: () => ({
        firstName: undefined as string | undefined,
        lastName: 'Doe',
      }),
      getters: {
        fullName(): string {

          const first = this.firstName ?? 'John'
          return `${first} ${this.lastName}`

        },
      },
    })

    const store = useOptional()

    expect(store.fullName).toBe('John Doe')

    store.firstName = 'Jane'
    expect(store.fullName).toBe('Jane Doe')

    store.firstName = undefined
    expect(store.fullName).toBe('John Doe')

  })

  it('should allow direct access to $state', () => {

    const useData = defineStore('stateAccess', {
      state: () => ({
        count: 0,
        name: 'Test',
      }),
      getters: {
        double: state => state.count * 2,
      },
    })

    const store = useData()

    expect(store.$state).toEqual({ count: 0, name: 'Test' })

    store.count = 5
    expect(store.$state.count).toBe(5)

    // Mutating $state directly should work
    store.$state.name = 'Updated'
    expect(store.name).toBe('Updated')

  })

  it('should serialize state using JSON.stringify($state)', () => {

    const useSerializable = defineStore('serializable', {
      state: () => ({
        id: 123,
        tags: ['active', 'verified'],
        meta: { created: '2025-11-20' },
      }),
      getters: {
        tagCount: state => state.tags.length,
      },
      actions: {
        addTag(tag: string) {

          this.tags.push(tag)

        },
      },
    })

    const store = useSerializable()

    // Serialize only $state, not the proxy with functions
    const json = JSON.stringify(store.$state)

    const parsed = JSON.parse(json) as typeof store.$state

    expect(parsed).toEqual({
      id: 123,
      tags: ['active', 'verified'],
      meta: { created: '2025-11-20' },
    })

  })

  it('should prevent assignment to readonly properties', () => {

    const useReadonly = defineStore('readonly', {
      state: () => ({ value: 0 }),
      getters: {
        doubled: state => state.value * 2,
      },
      actions: {
        increment() {

          this.value++

        },
      },
    })

    const store = useReadonly()

    // Attempting to assign to getters, actions, or $ properties should throw
    expect(() => {

      // @ts-expect-error - testing runtime behavior
      store.doubled = 100

    }).toThrow(StoreError.get('readonlyProperty', 'doubled'))

    expect(() => {

      // @ts-expect-error - testing runtime behavior
      store.increment = () => {
        // No-op
      }

    }).toThrow(StoreError.get('readonlyProperty', 'increment'))

    expect(() => {

      // @ts-expect-error - testing runtime behavior
      store.$id = 'new-id'

    }).toThrow(StoreError.get('readonlyProperty', '$id'))

  })

  it('should support store with only state (no getters or actions)', () => {

    const usePlainState = defineStore('plainState', {
      state: () => ({
        flag: true,
        counter: 0,
      }),
    })

    const store = usePlainState()

    expect(store.flag).toBe(true)
    expect(store.counter).toBe(0)

    store.flag = false
    store.counter = 42

    expect(store.flag).toBe(false)
    expect(store.counter).toBe(42)

    expect(store.$state).toEqual({ flag: false, counter: 42 })

  })

  it('should support store with only getters (no actions)', () => {

    const useComputed = defineStore('computed', {
      state: () => ({
        width: 10,
        height: 5,
      }),
      getters: {
        area: state => state.width * state.height,
        perimeter: state => 2 * (state.width + state.height),
      },
    })

    const store = useComputed()

    expect(store.area).toBe(50)
    expect(store.perimeter).toBe(30)

    store.width = 20
    expect(store.area).toBe(100)
    expect(store.perimeter).toBe(50)

  })

  it('should support store with only actions (no getters)', () => {

    const useActions = defineStore('actionsOnly', {
      state: () => ({
        items: [] as string[],
      }),
      actions: {
        add(item: string) {

          this.items.push(item)

        },
        clear() {

          this.items = []

        },
      },
    })

    const store = useActions()

    expect(store.items).toEqual([])

    store.add('apple')
    store.add('banana')
    expect(store.items).toEqual(['apple', 'banana'])

    store.clear()
    expect(store.items).toEqual([])

  })

  it('should support completely empty store', () => {

    const useEmpty = defineStore('empty', {
      state: () => ({}),
    })

    const store = useEmpty()

    expect(store.$id).toBe('empty')
    expect(store.$state).toEqual({})
    expect(typeof store.$patch).toBe('function')
    expect(typeof store.$reset).toBe('function')

  })

  it('should allow actions to call other actions', () => {

    const useChained = defineStore('chained', {
      state: () => ({
        value: 0,
        log: [] as string[],
      }),
      actions: {
        addLog(message: string) {

          this.log.push(message)

        },
        increment() {

          this.value++
          this.addLog(`incremented to ${this.value}`)

        },
        decrement() {

          this.value--
          this.addLog(`decremented to ${this.value}`)

        },
      },
    })

    const store = useChained()

    store.increment()
    expect(store.value).toBe(1)
    expect(store.log).toEqual(['incremented to 1'])

    store.decrement()
    expect(store.value).toBe(0)
    expect(store.log).toEqual(['incremented to 1', 'decremented to 0'])

  })

  it('should allow getters to access other getters', () => {

    const useNested = defineStore('nested', {
      state: () => ({
        firstName: 'John',
        lastName: 'Doe',
      }),
      getters: {
        fullName(): string {

          return `${this.firstName} ${this.lastName}`

        },
        greeting(): string {

          return `Hello, ${this.fullName}!`

        },
        uppercased(): string {

          return this.greeting.toUpperCase()

        },
      },
    })

    const store = useNested()

    expect(store.fullName).toBe('John Doe')
    expect(store.greeting).toBe('Hello, John Doe!')
    expect(store.uppercased).toBe('HELLO, JOHN DOE!')

    store.firstName = 'Jane'
    expect(store.uppercased).toBe('HELLO, JANE DOE!')

  })

  it('should handle arrays in state correctly', () => {

    const useList = defineStore('list', {
      state: () => ({
        items: [1, 2, 3],
        tags: ['a', 'b'],
      }),
      getters: {
        total: state => state.items.reduce((sum, n) => sum + n, 0),
      },
      actions: {
        addItem(item: number) {

          this.items.push(item)

        },
      },
    })

    const store = useList()

    expect(store.items).toEqual([1, 2, 3])
    expect(store.total).toBe(6)

    store.addItem(4)
    expect(store.items).toEqual([1, 2, 3, 4])
    expect(store.total).toBe(10)

    store.$patch({ tags: ['c', 'd', 'e'] })
    expect(store.tags).toEqual(['c', 'd', 'e'])

  })

  it('should preserve $id in scoped instances', () => {

    const useScopedId = defineStore('scopedId', {
      state: () => ({ value: 0 }),
    })

    const storeA = useScopedId('instance-a')
    const storeB = useScopedId('instance-b')

    expect(storeA.$id).toBe('scopedId/instance-a')
    expect(storeB.$id).toBe('scopedId/instance-b')

    // Default instance
    const storeDefault = useScopedId()
    expect(storeDefault.$id).toBe('scopedId')

  })

  it('should handle boolean state correctly with nullish coalescing', () => {

    const useFlags = defineStore('flags', {
      state: () => ({
        enabled: undefined as boolean | undefined,
        active: false as boolean | undefined,
        visible: true as boolean | undefined,
      }),
    })

    const store = useFlags()

    // Be careful with booleans and ?? operator
    expect(store.enabled ?? true).toBe(true)
    expect(store.active ?? true).toBe(false) // false is not nullish
    expect(store.visible ?? false).toBe(true)

    store.enabled = false as boolean | undefined
    expect(store.enabled ?? true).toBe(false) // false is not nullish

  })

  it('should handle zero and empty string with nullish coalescing', () => {

    const useFalsy = defineStore('falsy', {
      state: () => ({
        count: 0 as number | null,
        text: '' as string | null,
        nullable: null as number | null,
      }),
    })

    const store = useFalsy()

    // Nullish coalescing only checks null/undefined, not falsy
    expect(store.count ?? 10).toBe(0) // 0 is not nullish
    expect(store.text ?? 'default').toBe('') // '' is not nullish
    expect(store.nullable ?? 42).toBe(42) // null is nullish

  })

})
