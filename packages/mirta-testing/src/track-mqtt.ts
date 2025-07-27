import { useEvent, type Event } from 'mirta'
import { type SimulatorInstance } from './types'

interface WithDevice {
  publish(controlId: string, value: WbRules.MqttValue): WithDevice
}

export interface TrackMqttSimulator extends SimulatorInstance {
  /** Отправляет одно или несколько сообщений. */
  publish(payload: WbRules.MqttMessage | WbRules.MqttMessage[]): void
  withDevice(deviceId: string): WithDevice
}

function createInstance(): TrackMqttSimulator {

  let mqttEvent: Event<WbRules.MqttMessage>

  function reset() {

    mqttEvent = useEvent<WbRules.MqttMessage>()

    global.trackMqtt = (topic: string, callback: (message: WbRules.MqttMessage) => void) => {

      mqttEvent.on((message) => {

        if (topic == message.topic)
          callback(message)

      })

    }

  }

  function publish(payload: WbRules.MqttMessage | WbRules.MqttMessage[]): void {

    if (!Array.isArray(payload))
      mqttEvent.raise(payload)
    else
      payload.forEach((item) => {

        mqttEvent.raise(item)

      })

  }

  function withDevice(deviceId: string): WithDevice {

    return {
      publish(controlId: string, value: WbRules.MqttValue) {

        mqttEvent.raise({
          topic: `/devices/${deviceId}/controls/${controlId}`,
          value,
        })

        return this

      },
    }

  }

  reset()

  return {
    reset,
    publish,
    withDevice,
  }

}

let instance: TrackMqttSimulator | undefined

/** Имитатор конструкции trackMqtt. */
export function useTrackMqtt() {

  return instance ??= createInstance()

}
