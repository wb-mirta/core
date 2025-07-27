interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

interface DebouncedFunc<TArgs extends unknown[]> {
  (...args: TArgs): void
  cancel(): void
  flush(): void
}

interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

interface ThrottledFunc<TArgs extends unknown[]> {
  (...args: TArgs): void
  cancel(): void
  flush(): void
}

const { now } = Date
const { min, max } = Math

export function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  wait: number,
  options: DebounceOptions = {}
) {

  let
    timeoutId: NodeJS.Timeout | undefined,
    lastCallTime = 0,
    lastInvokeTime = 0,
    lastArgs: TArgs | undefined

  const maxWait = options.maxWait
    ? max(options.maxWait, wait)
    : 0

  const { leading = false, trailing = true } = options

  function invokeCallback(time: number) {

    const args = lastArgs

    if (!args)
      return

    lastArgs = void 0
    lastInvokeTime = time

    callback(...args)

  }

  function leadingEdge(time: number) {

    // Reset any `maxWait` timer.
    lastInvokeTime = time

    // Start the timer for the trailing edge.
    timeoutId = setTimeout(timeoutReached, wait)

    // Invoke the leading edge.
    if (leading)
      invokeCallback(time)

  }

  function trailingEdge(time: number) {

    timeoutId = void 0

    if (trailing && lastArgs) {

      invokeCallback(time)
      return

    }

    lastArgs = undefined

  }

  function remainingWait(time: number) {

    const
      timeSinceLastCall = time - lastCallTime,
      timeSinceLastInvoke = time - lastInvokeTime,
      timeWaiting = wait - timeSinceLastCall

    return maxWait > 0
      ? min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting

  }

  function shouldInvoke(time: number) {

    const
      timeSinceLastCall = time - lastCallTime,
      timeSinceLastInvoke = time - lastInvokeTime

    return lastCallTime == 0
      || (timeSinceLastCall >= wait)
      || (timeSinceLastCall < 0)
      || (maxWait > 0 && timeSinceLastInvoke >= maxWait)

  }

  function timeoutReached() {

    const time = now()

    if (shouldInvoke(time)) {

      trailingEdge(time)
      return

    }

    timeoutId = setTimeout(timeoutReached, remainingWait(time))

  }

  const debouncedFunc: DebouncedFunc<TArgs> = (...args: TArgs) => {

    const
      time = now(),
      isInvoking = shouldInvoke(time)

    lastArgs = args
    lastCallTime = time

    if (isInvoking) {

      if (!timeoutId) {

        leadingEdge(lastCallTime)
        return

      }

      if (maxWait > 0) {

        clearTimeout(timeoutId)
        timeoutId = setTimeout(timeoutReached, wait)
        invokeCallback(lastCallTime)

      }

    }

    timeoutId ??= setTimeout(timeoutReached, wait)

  }

  debouncedFunc.cancel = () => {

    if (timeoutId !== undefined) {

      clearTimeout(timeoutId)

    }

    lastInvokeTime = 0
    lastArgs = timeoutId = undefined

  }

  debouncedFunc.flush = () => {

    if (timeoutId)
      trailingEdge(now())

  }

  return debouncedFunc

}

export function throttle<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  wait: number,
  options: ThrottleOptions = {}
) {

  const { leading = true, trailing = true } = options

  return debounce(callback, wait, {
    leading,
    trailing,
    maxWait: wait,
  }) as ThrottledFunc<TArgs>

}
