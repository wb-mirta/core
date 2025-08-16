import type { DeviceType, DeviceContext } from './device'
import { createControl, type MaybeReadonlyControl } from './control'
import type { StrictWhenSpecified, HasPropertyOfType } from './type-utils'
import { isFunction } from '@mirta/basics'
import '@mirta/polyfills'

// Внимание! Внутренняя типизация, может измениться.

/**
 * Определяет соответствие между свойствами
 * {@link ControlType.type} и {@link ControlType.defaultValue}.
 *
 **/
interface ControlType<TControl, TValue> {
  /** Тип контрола. */
  type: TControl
  /** Значение по умолчанию. */
  defaultValue?: TValue
}

/**
 * Служит механизмом безопасного преобразования типов контролов
 * в конкретные типы значений.
 **/
type TypeMapper<K extends keyof WbRules.TypeMappings = keyof WbRules.TypeMappings>
  = K extends infer TControl
    ? ControlType<TControl, WbRules.TypeMappings[K]>
    : never

type VirtualTypeMapper<K extends keyof WbRules.TypeMappings = keyof WbRules.TypeMappings>
  = K extends infer TControl
    ? (
        ControlType<TControl, WbRules.TypeMappings[K]>
        // Добавляет расширенные свойства, соответственно типу контрола.
        & WbRules.ControlTypeExtension<TControl>
      )
    : never

interface BaseControlDef {
  /** Идентификатор контрола. Если не указан, используется название свойства. */
  controlId?: string
  /** Если `true`, то значение доступно только для чтения. */
  isReadonly?: boolean
}

/**
 * Определения основных контролов.
 * Расширяют возможные типы контролов поддержкой общих полей.
 **/
type ControlDef = Expand<
  TypeMapper
  & BaseControlDef
>

/**
 * Определения виртуальных контролов.
 * Расширяют определения основных контролов поддержкой дополнительных полей,
 * характерных только для виртуальных устройств.
 **/
type VirtualControlDef = Expand<
  VirtualTypeMapper
  & BaseControlDef
  & {
  /** Имя, публикуемое в MQTT-топике */
    title?: WbRules.Title
    /** Если включено, устанавливает значение по умолчанию при перезапуске. */
    forceDefault?: boolean
    /** Если включено, не создаёт контрол в MQTT, пока ему не будет присвоено какое-либо значение. */
    lazyInit?: boolean
    /** Порядок следования полей */
    order?: number
  }>

/** Набор контролов, не поддерживающий переопределение. */
type Controls
  = Record<string, ControlDef>

/** Набор контролов с поддержкой переопределения. */
type VirtualControls
  = Record<string, VirtualControlDef>

/**
 * Обеспечивает строго контролируемую вариативность в зависимости
 * от контекста вызова.
 *
 * Проверяет совместимость с прототипом `Controls`,
 * предотвращая появление неучтённых свойств (например тех,
 * что используются только для виртуальных устройств).
 **/
type StrictControls<TControls extends Controls>
  = TControls & Controls

/**
 * Обеспечивает строго контролируемую вариативность в зависимости
 * от контекста вызова.
 *
 * Проверяет совместимость с прототипом `VirtualControls`,
 * предотвращая появление неучтённых свойств.
 **/
type StrictVirtualControls<TControls extends VirtualControls>
  = TControls & VirtualControls

/**
 * Набор готовых к использованию контролов, передаётся в `setup()`
 * при описании устройства в `defineDevice()`.
 **/
type CreatedControls<
  TControls extends Controls | VirtualControls
> = {
  [K in keyof TControls]: Expand<
    MaybeReadonlyControl<
      StrictWhenSpecified<
        TControls[K],
        'defaultValue',
        WbRules.TypeMappings[TControls[K]['type']]
      >,
      TControls[K]['isReadonly']
    >
  >
}

/** Используется для извлечения типа значения из значения по умолчанию. */
type InferDefaultType<TProp>
  = [TProp] extends [{ defaultValue: infer TDefault }]
    ? TDefault extends (() => infer TReturn)
      ? TReturn
      : TDefault
    : TProp

/** Извлекает реальный тип свойства из его определения. */
type InferPropType<TProp>
  = [TProp] extends [ObjectConstructor | { type: ObjectConstructor }]
    ? Record<string, unknown>
    : [TProp] extends [BooleanConstructor | { type: BooleanConstructor }]
        ? boolean
        : [TProp] extends [NumberConstructor | { type: NumberConstructor }]
            ? number
            : [TProp] extends [StringConstructor | { type: StringConstructor }]
                ? string
                : [TProp] extends [DateConstructor | { type: DateConstructor }]
                    ? Date
                    // Произвольное преобразование вида `Object as PropType<MyType>`
                    : [TProp] extends [PropType<infer TValue> | { type: PropType<infer TValue> } | undefined]
                        ? TValue
                        // Когда ничего подходящего не нашлось, извлечь тип из свойства `defaultValue`.
                        : InferDefaultType<TProp>

/** Обязательные ключи свойств - потребуют их явного указания при вызове useDevice(). */
type RequiredKeys<TProps> = {
  [K in keyof TProps]: TProps[K] extends { isRequired: true }
    ? TProps[K] extends { defaultValue: undefined | (() => undefined) }
      ? never
      : K
    : never
}[keyof TProps]

/**
 * Опциональные ключи свойств - указываются по необходимости.
 *
 * Рекомендуется использовать совместно с параметром {@link PropMetadata.defaultValue}.
 */
type OptionalKeys<TProps>
  = Exclude<keyof TProps, RequiredKeys<TProps>>

type RequiredSetupKeys<TProps> = {
  [K in keyof TProps]: TProps[K] extends { isRequired: true } | { defaultValue: unknown }
    ? TProps[K] extends { defaultValue: undefined | (() => undefined) }
      ? never
      : K
    : never
}[keyof TProps]

type OptionalSetupKeys<TProps> = Exclude<keyof TProps, RequiredKeys<TProps>>

/**
 * Параметры устройства для уточнения стартовой конфигурации.
 *
 * Например, можно передать значения низкого и критического уровня заряда, определяя контрол батареи.
 */
type Props<TProps> = {
  [K in keyof Pick<TProps, RequiredKeys<TProps>>]: InferPropType<TProps[K]>
} & {
  [K in keyof Pick<TProps, OptionalKeys<TProps>>]?: InferPropType<TProps[K]>
}

/**
 * В отличие от {@link Props}, формирует строгое значение свойства
 * при заданном параметре {@link PropMetadata.defaultValue}.
 *
 **/
type SetupProps<TProps> = {
  [K in keyof Pick<TProps, RequiredSetupKeys<TProps>>]: Readonly<InferPropType<TProps[K]>>
} & {
  [K in keyof Pick<TProps, OptionalSetupKeys<TProps>>]?: Readonly<InferPropType<TProps[K]>>
}

type PropMethod<TProp, TConstructor = unknown> = [TProp] extends [
  ((...args: unknown[]) => unknown) | undefined
] // if is function with args, allowing non-required functions
  ? { new (): TConstructor, (): TProp, readonly prototype: TConstructor } // Create Function like constructor
  : never

type PropConstructor<TProp = unknown>
  = | (new(...args: unknown[]) => TProp & {})
    | (() => TProp)
    | PropMethod<TProp>

/**
 * Тип параметра контрола.
 * @example
 * ```ts
 * const useDevice = defineWiredDevice({
 *   props: {
 *     // Неявное использование PropType для извлечения типа.
 *     count: Number
 *   }
 * })
 * ```
 * @example
 * ```ts
 * interface BatteryProps {
 *   lowLevel: number
 *   criticalLevel: number
 * }
 *
 * const useDevice = defineWiredDevice({
 *   props: {
 *     // Явное использование PropType для извлечения типа.
 *     battery: Object as PropType<BatteryProps>
 *   }
 * })
 * ```
 **/
export type PropType<TProp> = PropConstructor<TProp> | (PropConstructor<TProp>)[]

/**
 * Метаданные свойства.
 *
 * Применяются для уточнения параметров свойства.
 *
 * @example
 * Делает свойство обязательным.
 *
 * ```ts
 * const useDevice = defineWiredDevice({
 *   props: {
 *     count: { type: Number, isRequired: true }
 *   }
 * })
 *
 * const devie = useDevice('my_device_id', {
 *   count: 0
 * })
 * ```
 * @example
 * Делает свойство опциональным, но строгим - предоставляет значение по умолчанию.
 *
 * ```ts
 * const useDevice = defineWiredDevice({
 *   props: {
 *     count: { type: Number, defaultValue: 0 }
 *   }
 * })
 *
 * const device = useDevice('my_device_id')
 * ```
 **/
interface PropMetadata<TProp> {
  /** Тип свойства. */
  type: TProp
  /** Признак обязательности. */
  isRequired?: boolean
  /** Значение по умолчанию. */
  defaultValue?: TProp | (() => TProp)
}

/**
 * Обеспечивает поддержку одновременно компактной и расширенной записи
 * определений начальных настроек устройства.
 *
 * @example
 * ```ts
 * const useDevice = defineWiredDevice({
 *   props: {
 *     // Компактная форма.
 *     count: Number,
 *     // Расширенная форма.
 *     checkInterval: { type: Number, defaultValue: 100 }
 *   }
 * })
 * ```
 */
type Prop<TProp> = PropMetadata<TProp> | PropType<TProp>

type PropsDefinition<TProps = Record<string, unknown>> = {
  [K in keyof TProps]: Prop<TProps[K]>
}

/** Определение проводного устройства. */
interface WiredDeviceOptions<TProps, TControls extends Controls, TResult> {
  setup: (options: { props: Readonly<Expand<SetupProps<TProps>>>, controls: CreatedControls<TControls> }) => TResult
  props?: TProps
  /** Контролы проводного устройства. */
  controls: StrictControls<TControls>
}

/** Определение виртуального устройства. */
interface VirtualDeviceOptions<TProps, TControls extends VirtualControls, TResult> {
  setup: (options: { props: Readonly<Expand<SetupProps<TProps>>>, controls: CreatedControls<TControls> }) => TResult
  props?: TProps
  /** Контролы виртуального устройства. */
  controls: StrictVirtualControls<TControls>
}

/** Определение Zigbee-устройства. */
interface ZigbeeDeviceOptions<TProps, TControls extends VirtualControls, TResult> {
  setup: (options: { props: Readonly<Expand<SetupProps<TProps>>>, controls: CreatedControls<TControls> }) => TResult
  props?: TProps
  /** Контролы Zigbee-устройства. */
  controls: StrictVirtualControls<TControls>
}

/**
 * Описывает конфигурацию устройства в зависимости от его типа - проводное, виртуальное или Zigbee.
 *
 * @template TDeviceType Тип устройства (проводное, виртуальное, беспроводное).
 * @template TProps Тип списка с определениями входящих параметров.
 * @template TControls Тип списка с определениями контролов устройства.
 * @template TResult Итоговый тип устройства.
 */
type DeviceOptions<
  TDeviceType extends DeviceType,
  TProps,
  TControls extends Controls | VirtualControls,
  TResult
>
  = TDeviceType extends 'wired'
    ? WiredDeviceOptions<TProps, TControls, TResult>
    : (TDeviceType extends 'virtual'
        ? VirtualDeviceOptions<TProps, TControls, TResult>
        : (TDeviceType extends 'zigbee'
            ? ZigbeeDeviceOptions<TProps, TControls, TResult>
            : never
          )
      )

/** Состояние устройства, общее для всех скриптов. */
interface SharedDeviceState {
  isReady: boolean
  isConfigurable: boolean
}

/**
 * Наделяет результирующее устройство возможностью передачи своего контекста.
 *
 * Используется во вспомогательных функциях, избавляя от необходимости прописывать идентификаторы вручную.
 *
 **/
interface DeviceWithContext {
  /** Контекст устройства - ключевая информация. */
  context: {
    /** Идентификатор устройства. */
    deviceId: string
    /** Признак готовности к работе. */
    isReady: boolean
  }
}

/** Итоговый тип устройства. */
type Device<TDefinition> = TDefinition & DeviceWithContext

const { assign } = Object

if (__TEST__)
  module.static = {}

/**
 * Содержит список проинициализированных устройств,
 * а также их статус готовности к работе.
 *
 * Например, если какой-либо из скриптов создал виртуальное устройство,
 * другие скрипты не должны пытаться создать его повторно.
 *
 **/
const alreadyConfigured = (
  module.static.configured ??= {}
) as Record<string, SharedDeviceState | undefined>

function createContext(
  deviceType: DeviceType,
  deviceId: string,
  state: SharedDeviceState
) {

  const context: DeviceContext = {
    get deviceType() {

      return deviceType

    },

    get deviceId() {

      return deviceId

    },

    get isReady() {

      return state.isReady

    },
  }

  return context

}

function configureControls(
  deviceId: string,
  controls: VirtualControls
) {

  const device = getDevice(deviceId)

  if (!device)
    return

  Object.keys(controls).forEach((key) => {

    const control = controls[key]
    const controlId = control.controlId ?? key

    if (__DEV__)
      log.debug(`Replacing the control '${controlId}' on '${deviceId}'`)

    if (device.isControlExists(controlId))
      device.removeControl(controlId)

    device.addControl(
      controlId,
      assign({}, control, {
        value: control.defaultValue,
        readonly: control.isReadonly,
      }) as WbRules.ControlOptions
    )

  })

}

function configureContext(
  type: DeviceType,
  deviceId: string,
  controls: Controls | VirtualControls,
  title?: WbRules.Title
) {

  if (__TEST__)
    alreadyConfigured[deviceId] = undefined

  if (alreadyConfigured[deviceId])
    return createContext(type, deviceId, alreadyConfigured[deviceId])

  const state = alreadyConfigured[deviceId] = {
    isReady: false,
    isConfigurable: true,
  } as SharedDeviceState

  const context = createContext(type, deviceId, state)

  if (state.isReady || !state.isConfigurable)
    return

  if (type === 'zigbee') {

    trackMqtt(`zigbee2mqtt/${deviceId}`, () => {

      if (state.isReady || !state.isConfigurable)
        return

      configureControls(deviceId, controls)

      state.isReady = true

    })

  }
  else {

    if (type === 'virtual') {

      const cells: Record<string, WbRules.ControlOptions> = {}

      Object.keys(controls).forEach((key) => {

        const cell = assign(
          {},
          controls[key],
          {
            value: controls[key]['defaultValue'],
          },
          controls[key]['isReadonly'] ? { readonly: true } : {}
        )

        cells[key] = cell as WbRules.ControlOptions

      })

      global.defineVirtualDevice(deviceId, {
        title: title ?? 'Untitled Virtual Device',
        cells,
      })

    }

    state.isReady = true

  }

  return context

}

function getValueOrDefault<TValue>(value?: TValue, defaultValue?: TValue | (() => TValue)) {

  return value ?? (
    isFunction(defaultValue)
      ? defaultValue()
      : defaultValue
  )

}

function createDevice<
  TDeviceType extends DeviceType,
  TProps extends PropsDefinition,
  TControls extends Controls | VirtualControls,
  TDevice extends object
>(
  deviceType: TDeviceType,
  deviceId: string,
  propDefs: TProps,
  props: Props<TProps>,
  options: DeviceOptions<TDeviceType, TProps, TControls, TDevice>
): Device<TDevice> {

  const controlDefs = options.controls

  const context = configureContext(
    deviceType,
    deviceId,
    controlDefs,
    deviceType === 'virtual'
      ? getValueOrDefault(
        props['title'],
        propDefs['title']['defaultValue']
      ) as WbRules.Title
      : ''
  )

  const setupProps: Record<string, unknown> = {}
  const controls: Record<string, unknown> = {}

  Object.keys(propDefs).forEach((key) => {

    // Устанавливает значение свойства по умолчанию,
    // если не указано иного.
    //
    setupProps[key] = getValueOrDefault(props[key], propDefs[key]['defaultValue'])

  })

  Object.keys(controlDefs).forEach((key) => {

    const controlDef = controlDefs[key]
    const controlId = controlDef.controlId ?? key

    const control = createControl({ deviceType, deviceId, isReady: true }, controlId, {
      type: controlDef.type,
      defaultValue: controlDef.defaultValue,
      isReadonly: controlDef.isReadonly,
    })

    controls[key] = control

  })

  const device = options.setup({
    props: setupProps as SetupProps<TProps>,
    controls: controls as CreatedControls<TControls>,
  })

  return assign(device, { context }) as Device<TDevice>

}

/**
 * В пределах каждого скрипта wb-rules (точки входа),
 * содержит синглтоны построенных в нём устройств соответственно
 * переданному в `useDevice()` идентификатору.
 *
 */
const devices: Record<string, DeviceWithContext | undefined> = {}

type UseDeviceFunc<TProps extends object, TDevice>
  = HasPropertyOfType<TProps, { isRequired: true }> extends true
    ? (deviceId: string, props: Expand<Props<TProps>>) => Device<TDevice>
    : (deviceId: string, props?: Expand<Props<TProps>>) => Device<TDevice>

function defineDevice<
  TDeviceType extends DeviceType,
  TProps extends PropsDefinition,
  TControls extends Controls | VirtualControls,
  TDevice extends object
>(
  type: TDeviceType,
  options: DeviceOptions<TDeviceType, TProps, TControls, TDevice>
): UseDeviceFunc<TProps, TDevice> {

  return (deviceId: string, props?: Expand<Props<TProps>>) => {

    // Девайс должен проходить полный цикл построения в юнит-тестах.
    if (__TEST__)
      devices[deviceId] = void 0

    return (
      // Строится единожды на скрипт, далее берётся из кэша.
      // При повторном вызове переданные свойства будут проигнорированы.
      devices[deviceId] ??= createDevice(type, deviceId, options.props ?? {}, props ?? {}, options)
    ) as Device<TDevice>

  }

}

/**
 * Определяет структуру проводного устройства.
 * @since 0.1.0
 **/
export function defineWiredDevice<
  TDeviceType extends DeviceType,
  TProps extends PropsDefinition,
  TControls extends Controls | VirtualControls,
  TDevice extends object
>(
  options: DeviceOptions<TDeviceType, TProps, TControls, TDevice>
) {

  return defineDevice('wired', options)

}

interface WithIntegratedTitleProp {
  title?: PropMetadata<PropType<WbRules.Title>> | PropType<WbRules.Title>
}

let virtualPerScript = 0

/**
 * Обеспечивает нумерацию безымянных виртуальных
 * устройств в пределах скрипта.
 *
 **/
const getNextVirtualNumber
  = () => virtualPerScript += 1

/**
 * Использует {@link getNextVirtualNumber} и возвращает
 * номер устройства, дополненный ведущими нулями.
 *
 * @returns Дополненная ведущими нулями строка с номером.
 *
 **/
function getNextVirtualNumberPadded() {

  const nextNumber = String(getNextVirtualNumber())

  if (nextNumber.length < 2)
    return '00' + nextNumber

  if (nextNumber.length < 3)
    return '0' + nextNumber

  return nextNumber

}

/**
 * Определяет структуру виртуального устройства.
 * @since 0.1.0
 **/
export function defineVirtualDevice<
  TDeviceType extends DeviceType,
  TProps extends PropsDefinition,
  TControls extends Controls | VirtualControls,
  TDevice extends object
>(
  options: DeviceOptions<TDeviceType, TProps & WithIntegratedTitleProp, TControls, TDevice>
) {

  // Виртуальные устройства определяют заголовок по умолчанию,
  // если он не передан во входящих параметрах.
  //
  options.props = assign(
    {},
    {
      title: {
        type: Object as PropType<WbRules.Title>, defaultValue: () => {

          const match = /\/([^/]+?)(?:\.js)?$/.exec(__filename)
          return `Virtual #${getNextVirtualNumberPadded()}${match?.[1] ? ` at '${match[1]}'` : ''}`

        },
      },
    },
    options.props
  )

  return defineDevice('virtual', options)

}

/**
 * Определяет структуру zigbee-устройства.
 * @since 0.1.0
 **/
export function defineZigbeeDevice<
  TDeviceType extends DeviceType,
  TProps extends PropsDefinition,
  TControls extends Controls | VirtualControls,
  TDevice extends object
>(
  options: DeviceOptions<TDeviceType, TProps, TControls, TDevice>
) {

  return defineDevice('zigbee', options)

}
