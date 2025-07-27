import '@mirta/polyfills'

export type StateTree = Record<PropertyKey, unknown>

interface DefineStoreOptions<
  TState extends StateTree
> {
  state?: () => TState
}

interface _StoreWithState<TState extends StateTree> {
  // $state: TState

  $patch(partialState: TState): void

  $patch(stateMutator: (state: TState) => void): void

  $reset(): void
}

type Store<
  TState extends StateTree
> = _StoreWithState<TState> & TState

type StoreGeneric = Store<
  StateTree
>

interface StoreDefinition<
  TState extends StateTree
> {
  (): Store<TState>
  $id: string
}

if (__TEST__) {

  module.static = {
    state: {},
  }

}

const stores: Record<string, StoreGeneric> = {}
const staticState = (module.static.state ??= {}) as Record<string, StateTree>

const { assign } = Object

function createStore<
  TState extends StateTree
>(
  id: string,
  options: DefineStoreOptions<TState>
): Store<TState> {

  const { state } = options

  const initialState: StateTree | undefined = staticState[id] as TState | undefined

  const localState = (initialState ?? (staticState[id] = state ? state() : {})) as TState

  function $patch(stateMutator: (state: TState) => void): void
  function $patch(partialState: TState): void
  function $patch(payload:
    | TState
    | ((state: TState) => void)
  ) {

    if (typeof payload === 'function') {

      payload(staticState[id] as TState)

    }
    else {

      assign(staticState[id], payload)

    }

    assign(store, staticState[id])

  }

  const $reset = function $reset(this: _StoreWithState<TState>) {

    const { state } = options
    const newState = state ? state() : {}

    this.$patch((state) => {

      assign(state, newState)

    })

  }

  const partialStore = {
    $id: id,
    $patch,
    $reset,
  }

  const store = assign(
    localState,
    partialStore
    // {
    //   get $state() {
    //     return staticState[id] as TState
    //   },
    //   set $state(state) {
    //     $patch($state => assign($state, state))
    //   }
    // }
  )

  return store

}

export function defineStore<
  TState extends StateTree
>(
  id: string,
  options: DefineStoreOptions<TState>
): StoreDefinition<TState> {

  function useStore(): Store<TState> {

    const store = (id in stores ? stores[id] : stores[id] = createStore(id, options)) as Store<TState>

    return store

  }

  useStore.$id = id

  return useStore

}
