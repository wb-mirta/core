export type DeviceType = 'wired' | 'virtual' | 'zigbee'

/** Контекст устройства. */
export interface DeviceContext {

  get deviceType(): DeviceType

  /** Идентификатор устройства. */
  get deviceId(): string

  /**
     * Признак готовности к работе,
     * значение меняется при смене статуса. */
  get isReady(): boolean
}

export type TrackCallback = (controlId: string, callback: (value: WbRules.MqttValue) => void) => void
