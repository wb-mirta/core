import { mock } from 'vitest-mock-extended'
import { useGetDevice } from './get-device'
import { useGetControl } from './get-control'
import { useTrackMqtt } from './track-mqtt'

export interface ZigbeeDevice {
  withLastSeen(value: string): ZigbeeDevice
  with(controlId: string, value: WbRules.MqttValue): ZigbeeDevice
  publishIsReady(): ZigbeeDevice
  publish(controlId: string, value: WbRules.MqttValue): ZigbeeDevice
}

export function defineZigbeeDevice(deviceId: string): ZigbeeDevice {

  const getDevice = useGetDevice()
  const getControl = useGetControl()
  const trackMqtt = useTrackMqtt()

  getDevice.defineDevice(deviceId, mock<WbRules.Device>({
    isVirtual() {

      return true

    },
    isControlExists() {

      return false

    },
  }))

  return {

    withLastSeen(value: WbRules.MqttValue) {

      getControl.defineValue(deviceId, 'last_seen', value)
      return this

    },

    with(controlId: string, value: WbRules.MqttValue) {

      getControl.defineValue(deviceId, controlId, value)
      return this

    },

    publishIsReady() {

      trackMqtt.publish({
        topic: `zigbee2mqtt/${deviceId}`,
        value: '',
      })

      return this

    },

    publish(controlId: string, value: WbRules.MqttValue) {

      trackMqtt.publish({
        topic: `/devices/${deviceId}/controls/${controlId}`,
        value,
      })

      return this

    },
  }

}
