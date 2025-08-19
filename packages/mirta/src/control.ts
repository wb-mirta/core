import { useEvent, type OnEvent } from '@mirta/basics'
import type { DeviceContext } from './device'
import { getControlSafe } from './get-control-safe'
import type { ReadonlyPropWhen, StrictWhenSpecified } from './type-utils'

/**
 * Набор политик, управляющих доступностью смены значения контрола.
 *
 * @since 0.2.0
 *
 **/
export enum ChangePolicies {
  /**
   * Политика по умолчанию.
   *
   * - Применяет {@link Public} к контролам типа `switch`, `pushbutton`, `range` и `rgb`;
   *
   * - Применяет {@link Script} к остальным типам контролов.
   *
   **/
  Default = 'default',

  /**
   * Установка значения возможна как скриптами wb-rules, так и сторонними службами.
   *
   * Применимо к контролам виртуальных устройств.
   *
   **/
  Public = 'public',

  /**
   * Установка значения возможна только скриптами wb-rules.
   *
   * Применимо к контролам виртуальных устройств.
   *
   **/
  Script = 'script',

  /**
   * Полный запрет записи, значение доступно только для чтения.
   *
   * Применимо к контролам реальных устройств.
   *
   **/
  ReadOnly = 'read-only'
}

// Внимание! Внутренняя типизация, может измениться.

/**
 * Определяет политику установки значений реальных устройств.
 *
 * @since 0.2.0
 *
 **/
export type ChangePolicy = `${Exclude<ChangePolicies, ChangePolicies.Public | ChangePolicies.Script>}`

/**
 * Определяет политику установки значений контролов виртуальных устройств.
 *
 * @since 0.2.0
 *
 **/
export type VirtualChangePolicy = `${Exclude<ChangePolicies, ChangePolicies.ReadOnly>}`

interface ControlOptions<
  TControl extends WbRules.ControlType,
  TValue
> {
  type: TControl
  defaultValue?: TValue
  forceDefault?: boolean
  lazyInit?: boolean
  changePolicy?: VirtualChangePolicy | ChangePolicy
}

type ValueEventHandler<TValue>
  = (newValue: TValue, oldValue: TValue) => void

export interface Control<TValue> {
  /** Актуальное значение контрола. */
  value: TValue
  /** Событие, происходящее когда поступило новое значение. */
  onValueReceived: OnEvent<ValueEventHandler<TValue>>
  /** Событие, происходящее когда значение изменилось. */
  onValueChanged: OnEvent<ValueEventHandler<TValue>>
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
 *
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
): MaybeReadonlyControl<TReturn, TOptions['changePolicy'] extends ChangePolicies.ReadOnly ? true : false> {

  const { deviceType, deviceId } = context
  const { type, changePolicy = ChangePolicies.Default } = options

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
   *
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

      if (changePolicy === ChangePolicies.ReadOnly) {

        log.warning(`A new value of '${deviceId}/${controlId}' has been rejected: control is readonly.`)
        return

      }

      setValue(newValue)

    },

    onValueReceived: valueReceived.on,

    onValueChanged: valueChanged.on,
  }

}
