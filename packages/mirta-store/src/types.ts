/* eslint-disable @typescript-eslint/unified-signatures */

/**
 * Рекурсивная версия утилитарного типа `Partial<T>`.
 *
 * @since 0.4.0
 *
 **/
export type DeepPartial<TTarget> = TTarget extends (infer TItem)[]
  ? TItem[]
  : TTarget extends object
    ? {
        [K in keyof TTarget]?: DeepPartial<TTarget[K]>
      }
    : TTarget;

/**
 * Тип, представляющий дерево состояния хранилища.
 *
 * Является объектом, где ключи — строки, числа или символы (`PropertyKey`),
 * а значения могут быть любого типа (`unknown`).
 *
 * Используется как базовый тип для `state` в хранилище.
 *
 * @example
 * ```ts
 * const state = { count: 0, active: true }
 * // Это StateTree
 * ```
 * @since 0.0.2
 *
 **/
export type StateTree = Record<PropertyKey, unknown>;

/**
 * Тип, представляющий дерево геттеров хранилища.
 *
 * Каждый геттер может быть:
 * - Функцией, принимающей `state` и возвращающей значение.
 * - Функцией без параметров, которая может использовать `this` для доступа к хранилищу.
 *
 * @template TState - Тип состояния, доступного в геттерах первого типа.
 *
 * @example
 * ```ts
 * const getters = {
 *   double: (state: { count: number }) => state.count * 2,
 *   label: () => `Значение: ${this.count}`
 * }
 * ```
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type _GettersTree<TState extends StateTree> = Record<
  string,
  | ((state: TState) => unknown)
  | (() => unknown)
>;

/**
 * Тип, представляющий дерево действий (actions) хранилища.
 *
 * Каждое действие — это метод, принимающий любые аргументы и возвращающий любое значение.
 * Внутри действия доступен `this` с полным контекстом хранилища.
 *
 * @example
 * ```ts
 * const actions = {
 *   increment(payload: number) {
 *     this.count += payload
 *   }
 * }
 * ```
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type _ActionsTree = Record<string, (...args: unknown[]) => unknown>;

/**
 * Интерфейс, добавляющий к хранилищу методы управления состоянием.
 *
 * Обеспечивает доступ к:
 * - `$id` — идентификатор экземпляра хранилища.
 * - `$state` — полное состояние хранилища.
 * - `$patch` — метод для частичного обновления состояния.
 * - `$reset` — метод для сброса состояния к начальному.
 *
 * @template TState - Тип состояния хранилища.
 *
 * @since 0.0.2
 *
 * @internal
 *
 **/
export interface _StoreWithState<TState extends StateTree> {
  /**
   * Идентификатор экземпляра хранилища.
   * Формируется как `typeId` или `typeId/id` для именованных экземпляров.
   *
   **/
  readonly $id: string;

  /**
   * Ссылка на полное состояние хранилища.
   *
   **/
  readonly $state: TState;

  /**
   * Обновляет состояние путём слияния с переданным объектом.
   * Выполняет глубокое слияние.
   *
   * @param state - Объект с полями, которые нужно обновить.
   *
   * @example
   * ```ts
   * store.$patch({ count: 5, name: 'Новое имя' })
   * ```
   *
   **/
  $patch(state: DeepPartial<TState>): void;

  /**
   * Обновляет состояние с помощью функции-мутатора.
   * Позволяет выполнять сложные обновления на основе текущего состояния.
   *
   * @param stateMutator - Функция, которая принимает текущее состояние и изменяет его.
   *
   * @example
   * ```ts
   * store.$patch(state => {
   *   state.count++
   *   state.log.push('increment')
   * })
   * ```
   *
   **/
  $patch(stateMutator: (state: TState) => void): void;

  /**
   * Сбрасывает состояние хранилища до начального.
   *
   * @example
   * ```ts
   * store.$reset()
   * ```
   *
   **/
  $reset(): void;
}

/**
 * Тип функции `$patch`, извлечённый из интерфейса `_StoreWithState`.
 *
 * Полезен для передачи в параметры или определения сигнатуры.
 *
 * @template TState - Тип состояния хранилища.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type _PatchFunc<TState extends StateTree>
  = _StoreWithState<TState>['$patch'];

/**
 * Тип аргументов, принимаемых методом `$patch`.
 *
 * Может быть либо частичным состоянием, либо функцией-мутатором.
 *
 * @template TState - Тип состояния хранилища.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type _PatchArgs<TState extends StateTree>
  = | DeepPartial<TState>
    | ((state: TState) => void);

/**
 * Тип, представляющий геттеры как свойства хранилища.
 *
 * Преобразует объект геттеров в объект значений:
 * - Каждый геттер `(state) => value` становится свойством с типом `value`.
 * - Каждый геттер `() => value` становится свойством с типом `value`.
 *
 * @template TGetters - Тип дерева геттеров.
 *
 * @example
 * ```ts
 * type Getters = { double: (s: S) => number, label: () => string }
 * type Result = _StoreWithGetters<Getters> // { double: number, label: string }
 * ```
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type _StoreWithGetters<TGetters> = {
  readonly [K in keyof TGetters]: TGetters[K] extends (...args: unknown[]) => infer R ? R : never
};

/**
 * Тип, представляющий действия как методы хранилища.
 *
 * @template TActions - Тип дерева действий.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type _StoreWithActions<TActions> = {
  readonly [K in keyof TActions]: TActions[K]
};

/**
 * Полный тип хранилища - итоговый тип, возвращаемый `defineStore`.
 *
 * Представляет собой объединение (intersection) всех компонентов хранилища.
 *
 * @template TState - Тип состояния.
 * @template TGetters - Тип геттеров.
 * @template TActions - Тип действий.
 *
 * @since 0.0.2
 *
 **/
export type Store<
  TState extends StateTree,
  TGetters,
  TActions extends _ActionsTree
> = _StoreWithState<TState>
  & TState
  & _StoreWithGetters<TGetters>
  & _StoreWithActions<TActions>;

/**
 * Универсальный тип хранилища, используемый для кэширования и внутренних операций.
 *
 * Подходит для переменных, которые могут содержать любое хранилище.
 *
 * @example
 * ```ts
 * const stores: Record<string, StoreGeneric> = {}
 * ```
 * @since 0.0.2
 *
 **/
export type StoreGeneric = Store<StateTree, unknown, _ActionsTree>;

/**
 * Опции, передаваемые в функцию `defineStore` для создания хранилища.
 *
 * Позволяет определить:
 * - `state` — функцию, возвращающую начальное состояние.
 * - `getters` — вычисляемые свойства.
 * - `actions` — методы для изменения состояния.
 *
 * Типы `ThisType` обеспечивают корректную типизацию `this` внутри геттеров и действий.
 *
 * @template TState - Тип состояния хранилища.
 * @template TGetters - Тип геттеров.
 * @template TActions - Тип действий.
 *
 * @since 0.0.2
 *
 **/
export interface DefineStoreOptions<
  TState extends StateTree,
  TGetters extends _GettersTree<TState>,
  TActions extends _ActionsTree
> {

  /**
   * Функция, возвращающая начальное состояние хранилища.
   * Вызывается при создании и сбросе хранилища.
   *
   * @example
   * state: () => ({
   *   count: 0,
   *   items: []
   * })
   *
   **/
  state?: () => TState;

  /**
   * Объект с геттерами (вычисляемыми свойствами).
   *
   * Внутри геттеров разрешён доступ к:
   * - `state` — если геттер принимает `state` как параметр.
   * - `this` — если геттер не принимает параметров (`() => ...`), через который доступны
   *   другие геттеры и состояние.
   *
   * @example
   * ```ts
   * getters: {
   *   double: (state) => state.count * 2,
   *   doublePlusOne: () => this.double + 1
   * }
   * ```
   * @since 0.4.0
   *
   **/
  getters?: TGetters & ThisType<TState & _StoreWithGetters<TGetters>>;

  /**
   * Объект с действиями (методами изменения состояния).
   *
   * Внутри действий разрешён доступ к:
   * - `this` — для чтения/записи `state`, вызова геттеров, использования `$patch`, `$reset`.
   *
   * @example
   * ```ts
   * actions: {
   *   increment() {
   *     this.count++
   *   },
   *   setCount(value: number) {
   *     this.$patch({ count: value })
   *   }
   * }
   * ```
   * @since 0.4.0
   *
   **/
  actions?: TActions & ThisType<TState & _StoreWithGetters<TGetters> & _StoreWithActions<TActions> & _StoreWithState<TState>>;

}

/**
 * Тип, представляющий результат вызова `defineStore()`.
 *
 * Это функция, которую можно вызвать для получения экземпляра хранилища,
 * с дополнительным свойством `$typeId`.
 *
 * @template TState - Тип состояния.
 * @template TGetters - Тип геттеров.
 * @template TActions - Тип действий.
 *
 * @example
 * ```ts
 * const useStore = defineStore('counter', { state: () => ({ count: 0 }) })
 * const store = useStore() // Получение экземпляра
 * ```
 *
 **/
export interface StoreDefinition<
  TState extends StateTree,
  TGetters extends _GettersTree<TState>,
  TActions extends _ActionsTree
> {

  /**
   * Идентификатор типа хранилища (указывается при вызове `defineStore`).
   * Используется для проверки дубликатов и логирования.
   *
   * @since 0.4.0
   *
   **/
  readonly $typeId: string;

  /**
   * Функция для получения экземпляра хранилища.
   *
   * @param scope - Опциональный ключ для создания именованного экземпляра.
   *                При передаче создаётся хранилище с идентификатором `typeId/scope`.
   *                При отсутствии возвращает общий экземпляр `typeId`.
   *
   * @returns Экземпляр хранилища.
   *
   * @example
   * ```ts
   * const store1 = useStore()
   * const store2 = useStore('sensor1')
   * const store3 = useStore('sensor2')
   * ```
   * @since 0.0.2
   *
   **/
  (scope?: string): Store<TState, TGetters, TActions>;
}
