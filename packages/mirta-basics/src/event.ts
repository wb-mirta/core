export type EventHandler = (...args: unknown[]) => void

export type OnEvent<THandler extends EventHandler>
  = (handler: THandler) => { off: () => void }

export type OnceEvent<THandler extends EventHandler>
  = (handler: THandler) => void

export interface Event<THandler extends EventHandler> {
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
  on: OnEvent<THandler>
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
  once: OnceEvent<THandler>
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
  off: (handler: THandler) => void
}

export interface EventRaiser<THandler extends EventHandler> extends Event<THandler> {

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
  raise: (...args: Parameters<THandler>) => void

  withoutRaise: () => Event<THandler>
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
 * // Тип обработчика события.
 * type CountEventHandler = (value: number) => void
 * // Событие с передачей типа обработчика.
 * const countChanged = useEvent<CountEventHandler>()
 * // Регистрация обработчика события.
 * countChanged.on((value) => { ... })
 * // Генерация события.
 * countChanged.raise(100)
 * ```
 */
export function useEvent<THandler extends EventHandler>(): EventRaiser<THandler> {

  const handlers: THandler[] = []

  function off(handler: THandler) {

    const index = handlers.indexOf(handler)

    if (index !== -1)
      handlers.splice(index, 1)

  }

  function on(handler: THandler) {

    handlers.push(handler)

    return {
      /** Отписывает от прослушивания события. */
      off: () => {

        off(handler)

      },
    }

  }

  function once(handler: THandler) {

    const wrapper = ((...args: Parameters<THandler>) => {

      handler(...args)
      off(wrapper)

    }) as THandler

    handlers.push(wrapper)

  }

  const raise = (...args: Parameters<THandler>) => {

    // Защита от сдвига в массиве при выполнении once.
    const handlersCopy = handlers.concat()

    for (let i = 0, len = handlersCopy.length; i < len; i++)
      (handlersCopy[i])(...args)

  }

  return {
    on,
    once,
    off,
    raise,
    withoutRaise: () => ({
      on,
      once,
      off,
    }),
  }

}
