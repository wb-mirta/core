export type EventHandler<TArgs> = (args: TArgs) => void

export interface Event<TArgs> {
  /**
   * Подписывает на событие, есть возможность отписки.
   * @example
   * ```ts
   * // Событие изменения состояния.
   * const stateChanged = useEvent()
   * // Подписка на прослушивание события.
   * const subscription = stateChanged.on(() => { ... })
   * // Отписка от прослушивания события.
   * subscription.off()
   * ```
   **/
  on: (handler: EventHandler<TArgs>) => { off: () => void }
  /**
   * Подписывает на событие, однократное выполнение.
   * @example
   * ```ts
   * // Событие изменения состояния.
   * const stateChanged = useEvent()
   * // Подписка на однократное прослушивание события.
   * stateChanged.once(() => { ... })
   * ```
   **/
  once: (handler: EventHandler<TArgs>) => void
  /**
   * Отписывает указанный обработчик от прослушивания события.
   * @example
   * ```ts
   * // Событие изменения состояния.
   * const stateChanged = useEvent()
   * // Обработчик события.
   * function handler() { ... }
   * // Регистрация обработчика.
   * stateChanged.on(handler)
   * // Прекращение прослушивания.
   * stateChanged.off(handler)
   * ```
   **/
  off: (handler: EventHandler<TArgs>) => void
  /**
   * Объявляет всем подписчикам о наступлении события.
   * @example
   * ```ts
   * // Событие изменения состояния.
   * const stateChanged = useEvent()
   * // Где-то в коде: объявление о наступлении события.
   * stateChanged.raise()
   * ```
   **/
  raise: (args: TArgs) => void
}

/**
 * Построитель экземпляра события.
 * @example
 * ```ts
 * // Событие без передачи аргументов.
 * const stateChanged = useEvent()
 * // Регистрация обработчика события.
 * stateChanged.on(() => { ... })
 * // Генерация события.
 * stateChanged.raise()
 * ```
 * @example
 * ```ts
 * // Событие с аргументами заданного типа.
 * const countChanged = useEvent<number>()
 * // Регистрация обработчика события.
 * countChanged.on((value) => { ... })
 * // Генерация события.
 * countChanged.raise(100)
 * ```
 */
export function useEvent<TArgs = void>(): Event<TArgs> {

  const handlers: EventHandler<TArgs>[] = []

  function off(handler: EventHandler<TArgs>) {

    const index = handlers.indexOf(handler)

    if (index !== -1)
      handlers.splice(index, 1)

  }

  function on(handler: EventHandler<TArgs>) {

    handlers.push(handler)

    return {
      /** Отписывает от прослушивания события. */
      off: () => {

        off(handler)

      },
    }

  }

  function once(handler: EventHandler<TArgs>) {

    const wrapper = (args: TArgs) => {

      handler(args)
      off(wrapper)

    }

    handlers.push(wrapper)

  }

  function raise(args: TArgs) {

    // Защита от сдвига в массиве при выполнении once.
    const handlersCopy = handlers.concat()

    for (let i = 0, len = handlersCopy.length; i < len; i++)
      (handlersCopy[i])(args)

  }

  return {
    on,
    once,
    off,
    raise,
  }

}
