import { useEvent, type Event } from '@mirta/basics'
import type { DeviceContext } from './device'
import { getControlSafe } from './get-control-safe'
import type { ReadonlyPropWhen, StrictWhenSpecified } from './type-utils'

// Внимание! Внутренняя типизация, может измениться.

interface ControlOptions<
  TControl extends WbRules.ControlType,
  TValue
> {
  type: TControl
  defaultValue?: TValue
  forceDefault?: boolean
  lazyInit?: boolean
  isReadonly?: boolean
}

type ValueEventHandler<TValue>
  = (newValue: TValue, oldValue: TValue) => void

export interface Control<TValue> {
  /** Актуальное значение контрола. */
  value: TValue
  /** Событие, происходящее когда поступило новое значение. */
  valueReceived: Event<ValueEventHandler<TValue>>
  /** Событие, происходящее когда значение изменилось. */
  valueChanged: Event<ValueEventHandler<TValue>>
}

export type MaybeReadonlyControl<TValue, TReadonly extends boolean | undefined>
  = ReadonlyPropWhen<Control<TValue>, 'value', TReadonly>

const typeMappings = {
  'text': 'string',
  'value': 'number',
  'switch': 'boolean',
  'pushbutton': 'boolean',
  'rgb': 'string',
  'range': 'number',
  'alarm': 'boolean',
} as const

/**
 * Создаёт контрол устройства.
 * @since 0.1.0
 **/
export function createControl<
  TControl extends WbRules.ControlType,
  TOptions extends ControlOptions<TControl, TValue>,
  TValue extends WbRules.TypeMappings[TOptions['type']],
  TReturn extends StrictWhenSpecified<TOptions, 'defaultValue', TValue>
>(
  context: DeviceContext,
  controlId: string,
  options: TOptions
): MaybeReadonlyControl<TReturn, TOptions['isReadonly']> {

  const { deviceType, deviceId } = context
  const { type, isReadonly } = options

  const defaultValue = 'defaultValue' in options
    ? options['defaultValue']
    : void 0

  const control = getControlSafe(context, controlId)

  /** Отправляет новое значение в контрол устройства. */
  const emitValue = (newValue: TReturn) => {

    if (newValue === void 0)
      return

    if (deviceType === 'zigbee') {

      publish(`zigbee2mqtt/${deviceId}/set`, JSON.stringify({ [controlId]: newValue }))

    }
    else {

      control.safe?.setValue(newValue)

    }

  }

  const valueReceived = useEvent<ValueEventHandler<TReturn>>()
  const valueChanged = useEvent<ValueEventHandler<TReturn>>()

  let localValue: TReturn

  /**
   * Устанавливает новое значение, если оно отличается от существующего.
   * @param newValue Устанавливаемое значение.
   * @param preventEmit Предотвращает отправку значения в устройство.
   **/
  function setValue(newValue: TReturn, preventEmit = false) {

    const oldValue = localValue

    valueReceived.raise(newValue, oldValue)

    if (oldValue === newValue)
      return

    localValue = newValue

    if (!preventEmit)
      emitValue(newValue)

    valueChanged.raise(newValue, oldValue)

  }

  trackMqtt(`/devices/${deviceId}/controls/${controlId}`, (payload) => {

    const incomingType = typeof payload.value
    const expectingType = typeMappings[type]

    if (incomingType === 'string' && expectingType === 'number') {

      const value = Number(payload.value)

      if (isNaN(value)) {

        log.error(`Value ignored: control '${deviceId}/${controlId}' expects number, but Number(value) is NaN.`)
        return

      }

      setValue(value as TReturn, true)

    }
    else {

      if (incomingType !== expectingType) {

        log.error(`Value ignored: control '${deviceId}/${controlId}' expects type '${expectingType}', but received '${incomingType}'`)
        return

      }

      setValue(payload.value as TReturn, true)

    }

  })

  return {

    get value() {

      if (localValue === undefined) {

        if (options.forceDefault)
          return localValue = defaultValue as TReturn

        if (!options.lazyInit)
          return localValue ??= control.safe?.getValue() as TReturn

      }

      return localValue

    },

    set value(newValue: TReturn) {

      if (isReadonly) {

        log.warning(`Value of '${deviceId}/${controlId}' is readonly`)
        return

      }

      setValue(newValue)

    },

    valueReceived: valueReceived
      .withoutRaise(),

    valueChanged: valueChanged
      .withoutRaise(),
  }

}
