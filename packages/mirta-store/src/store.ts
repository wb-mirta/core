import '@mirta/polyfills'
import { deepMerge, hasOwn } from '@mirta/basics/object'
import { StoreError } from './errors'
import type {
  StateTree,
  _StoreWithState,
  _PatchFunc,
  _PatchArgs,
  Store,
  StoreGeneric,
  StoreDefinition,
  DefineStoreOptions,
  _GettersTree,
  _ActionsTree
} from './types'
import {
  enforceDefinitionIsUnique,
  __resetInternalState as __resetStoreDefinitions
} from './enforce-unique'

const { assign } = Object

/**
 * Кэш созданных экземпляров хранилищ.
 *
 * Обеспечивает повторное использование одного и того же экземпляра хранилища
 * при многократных вызовах `useStore()`. Ключ — идентификатор хранилища (`storeId`),
 * значение — сам экземпляр хранилища.
 *
 * @internal
 *
 **/
let stores: Record<string, StoreGeneric> = {}

// Первичная инициализация для тестов.
if (__TEST__)
  __resetInternalState()

/**
 * Получает или создаёт статическое состояние хранилища в `module.static`.
 *
 * Обеспечивает сохранение состояния между перезапусками скриптов
 * и межскриптовое взаимодействие через общий контекст `module.static`.
 *
 * @param storeId - Уникальный идентификатор хранилища.
 * @param createState - Функция, возвращающая начальное состояние хранилища.
 * @returns Актуальное состояние хранилища — либо существующее, либо новое.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
function getStaticState(storeId: string, createState: () => StateTree): StateTree {

  const states = (module.static.states ??= {}) as Record<string, StateTree>

  return states[storeId] ??= createState()

}

/**
 * Создаёт экземпляр хранилища с заданными параметрами.
 *
 * Формирует реактивный объект на основе `Proxy`, объединяющий состояние, геттеры и действия.
 * Обеспечивает корректную работу `this` внутри `actions` и геттеров.
 *
 * @param storeId - Уникальный идентификатор экземпляра хранилища.
 * @param options - Параметры хранилища: `state`, `getters`, `actions`.
 * @returns Прокси-объект хранилища с полной функциональностью.
 *
 * @template TState - Тип дерева состояния.
 * @template TGetters - Тип дерева геттеров.
 * @template TActions - Тип дерева действий.
 *
 * @internal
 *
 **/
function createStore<
  TState extends StateTree,
  TGetters extends _GettersTree<TState>,
  TActions extends _ActionsTree
>(
  storeId: string,
  options: DefineStoreOptions<TState, TGetters, TActions>
): Store<TState, TGetters, TActions> {

  // Функция для создания начального состояния
  const createState = () => options.state ? options.state() : {}

  // 1. Получение или создание общего состояния в module.static
  const staticState = getStaticState(storeId, createState)

  // 2. Инициализация геттеров как функций, возвращающих вычисленное значение
  const getters: Record<string, () => unknown> = {}

  if (options.getters) {

    for (const key in options.getters) {

      if (!hasOwn(options.getters, key))
        continue

      const getter = options.getters[key]

      // Поддержка геттеров вида (state) => value и () => value
      getters[key] = typeof getter === 'function' && getter.length > 0
        ? () => getter.call(null, staticState) as unknown
        : () => getter.call(proxy) as unknown

    }

  }

  // Метод для частичного обновления состояния
  const $patch: _PatchFunc<TState> = (mutator: _PatchArgs<TState>) => {

    if (typeof mutator === 'function') {

      mutator(staticState as TState)

    }
    else {

      const merged = deepMerge(staticState, mutator)

      for (const key in merged)
        staticState[key] = merged[key]

    }

  }

  // Метод для сброса состояния до начального
  const $reset = () => {

    const newState = createState()

    $patch(state => assign(state, newState))

  }

  // Создание контекста `this` для действий
  // Обеспечивает доступ к $state, $patch, геттерам и текущему состоянию
  const actionThis = new Proxy(
    {
      $state: staticState,
      $id: storeId,
      $patch,
      $reset,
      ...getters,
    },
    {
      get(target, key: string) {

        // Состояние
        if (key in staticState)
          return staticState[key]

        // Геттеры
        if (key in getters)
          return getters[key]()

        if (key in actions)
          return actions[key]

        // Служебные свойства
        if (key in target)
          return target[key as keyof typeof target]

        throw StoreError.get('unknownProperty', key)

      },
      set(target, key: string, value: unknown) {

        if (key in target)
          throw StoreError.get('readonlyProperty', key)

        if (!(key in staticState))
          throw StoreError.get('unknownProperty', key)

        staticState[key] = value

        return true

      },
    })

  // Привязка действий к контексту `actionThis`
  const actions: Record<string, unknown> = {}

  if (options.actions) {

    for (const key in options.actions) {

      if (!hasOwn(options.actions, key))
        continue

      actions[key] = options.actions[key].bind(actionThis)

    }

  }

  // Реестр служебных свойств и методов хранилища
  const internals = {

    $state: () => staticState,
    $id: () => storeId,
    $patch: () => $patch,
    $reset: () => $reset,

  }

  // Финальный прокси-объект хранилища
  const proxy = new Proxy(staticState, {

    get(target, key: string) {

      // Состояние
      if (key in target)
        return target[key]

      // Геттеры
      if (key in getters)
        return getters[key]()

      // Действия
      if (key in actions)
        return actions[key]

      // Служебные свойства
      if (key in internals)
        return internals[key as keyof typeof internals]()

      throw StoreError.get('unknownProperty', key)

    },

    set(target, key: string, value: unknown): boolean {

      if (key in internals || key in getters || key in actions)
        throw StoreError.get('readonlyProperty', key)

      if (!(key in target))
        throw StoreError.get('unknownProperty', key)

      target[key] = value
      return true

    },

    has(target, key: string): boolean {

      return (
        key in internals
        || key in getters
        || key in actions
        || key in target
      )

    },

  }) as Store<TState, TGetters, TActions>

  return proxy

}

/**
 * Определяет новое хранилище с заданным именем и параметрами.
 *
 * Является основной точкой входа для создания хранилищ.
 * Возвращает функцию `useStore()`, используемую для получения экземпляра хранилища.
 *
 * @param type - Уникальный тип хранилища.
 * @param options - Конфигурация хранилища: `state`, `getters`, `actions`.
 * @returns Функция `useStore`, создающая или возвращающая экземпляр хранилища.
 *
 * @template TState - Тип состояния хранилища.
 * @template TGetters - Тип вычисляемых свойств.
 * @template TActions - Тип методов мутации состояния.
 *
 * @throws {StoreError} Если хранилище с таким именем уже определено.
 *
 * @example
 * ```ts
 * const useCounter = defineStore('counter', {
 *   state: () => ({ count: 0 }),
 *   getters: { double: (state) => state.count * 2 },
 *   actions: { increment() { this.count++ } }
 * })
 *
 * const store = useCounter()
 * ```
 * @since 0.0.2
 *
 **/
export function defineStore<
  TState extends StateTree,
  TGetters extends _GettersTree<TState>,
  TActions extends _ActionsTree
>(
  typeId: string,
  options: DefineStoreOptions<TState, TGetters, TActions>
): StoreDefinition<TState, TGetters, TActions> {

  enforceDefinitionIsUnique(typeId)

  /**
   * Возвращает экземпляр хранилища.
   *
   * При первом вызове создаёт хранилище, при последующих — возвращает из кэша.
   * Поддерживает создание именованных экземпляров через параметр `scope`.
   *
   * @param scope - Опциональный ключ для создания именованного экземпляра.
   *                Если указан, создаётся хранилище с идентификатором `typeId/scope`.
   *                Если не указан — возвращается общий экземпляр хранилища `typeId`.
   *
   * @returns Экземпляр хранилища требуемого типа.
   *
   * @since 0.0.2
   *
   **/
  function useStore(scope?: string): Store<TState, TGetters, TActions> {

    const storeId = scope ? `${typeId}/${scope}` : typeId

    return (

      stores[storeId] ??= createStore(storeId, options)

    ) as Store<TState, TGetters, TActions>

  }

  useStore.$typeId = typeId

  return useStore

}

/**
 * Сбрасывает внутреннее состояние (для тестов).
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export function __resetInternalState() {

  if (!__TEST__)
    return

  module.static = {
    states: {},
  }

  stores = {}

  __resetStoreDefinitions()

}
