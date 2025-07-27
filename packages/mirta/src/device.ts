/** Контекст устройства. */
export interface DeviceContext {
  /** Идентификатор устройства. */
  get id(): string

  /**
     * Признак готовности к работе,
     * значение меняется при смене статуса. */
  get isReady(): boolean
}

export type TrackCallback = (controlId: string, callback: (value: WbRules.MqttValue) => void) => void

/** Контекст плагина для привязки к устройству. */
export interface PluginContext {
  device: DeviceContext
  track: TrackCallback
}

/** Плагин для расширения функциональности устройства. */
export type DevicePlugin<TPlugin = unknown>
  = (context: PluginContext) => TPlugin
