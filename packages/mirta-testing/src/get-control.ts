import { isObject } from 'mirta';
import { type SimulatorInstance } from './types';
import { mock } from 'vitest-mock-extended';

/** Интерфейс имитатора конструкции `getControl`. */
export interface GetControlSimulator extends SimulatorInstance {

  /** Устанавливает значение для указанного контрола. */
  defineValue(deviceId: string, controlId: string, value: WbRules.MqttValue): void;

  /** Устанавливает набор значений для различных контролов. */
  defineValues(presets: { deviceId: string; controlId: string; value: WbRules.MqttValue }[]): void;
}

function createInstance(): GetControlSimulator {

  function reset() {

    global.getControl = (controlPath: string) => {

      if (!(controlPath in dev))
        return undefined;

      return mock<WbRules.Control>({
        getValue: () => dev[controlPath] as WbRules.MqttValue,
        setValue: rawValue => dev[controlPath] = isObject(rawValue)
          ? rawValue.value
          : rawValue,
      });

    };

  }

  function defineValue(deviceId: string, controlId: string, value: WbRules.MqttValue) {

    dev[`${deviceId}/${controlId}`] = value;

  }

  function defineValues(presets: { deviceId: string; controlId: string; value: WbRules.MqttValue }[]) {

    presets.forEach((preset) => {

      dev[`${preset.deviceId}/${preset.controlId}`] = preset.value;

    });

  }

  reset();

  return {
    reset,
    defineValue,
    defineValues,
  };

}

let instance: GetControlSimulator | undefined;

/** Имитатор конструкции `getControl`. */
export function useGetControl() {

  return instance ??= createInstance();

}
