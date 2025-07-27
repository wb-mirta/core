import { type SimulatorInstance } from './types'
import { mock } from 'vitest-mock-extended'

/** Интерфейс имитатора конструкции `getControl`. */
export interface GetControlSimulator extends SimulatorInstance {

  /** Устанавливает значение для указанного контрола. */
  defineValue(deviceId: string, controlId: string, value: WbRules.MqttValue): void

  /** Устанавливает набор значений для различных контролов. */
  defineValues(presets: { deviceId: string, controlId: string, value: WbRules.MqttValue }[]): void
}

function createInstance(): GetControlSimulator {

  let values: Record<string, WbRules.MqttValue> = {}

  function reset() {

    values = {}

    global.getControl = (devicePath: string) => {

      return mock<WbRules.Control>({
        getValue: () => values[devicePath],
      })

    }

  }

  function defineValue(deviceId: string, controlId: string, value: WbRules.MqttValue) {

    values[`${deviceId}/${controlId}`] = value

  }

  function defineValues(presets: { deviceId: string, controlId: string, value: WbRules.MqttValue }[]) {

    presets.forEach((preset) => {

      values[`${preset.deviceId}/${preset.controlId}`] = preset.value

    })

  }

  reset()

  return {
    reset,
    defineValue,
    defineValues,
  }

}

let instance: GetControlSimulator | undefined

/** Имитатор конструкции `getControl`. */
export function useGetControl() {

  return instance ??= createInstance()

}
