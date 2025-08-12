export type MqttMessageEventHandler = (message: WbRules.MqttMessage) => void

export interface SimulatorInstance {
  /** Сбрасывает настройки имитатора перед очередным тестом. */
  reset(): void
}
