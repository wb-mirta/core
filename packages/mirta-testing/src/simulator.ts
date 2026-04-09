import { useDefineRule, type DefineRuleSimulator } from './define-rule';
import { useTrackMqtt, type TrackMqttSimulator } from './track-mqtt';
import { useGetDevice, type GetDeviceSimulator } from './get-device';
import { useGetControl, type GetControlSimulator } from './get-control';
import { defineZigbeeDevice, type ZigbeeDevice } from './define-device';
import { type SimulatorInstance } from './types';
import { useDev } from './dev';
import { useDefineVirtualDevice } from '#define-virtual-device';

interface CoreSimulator extends SimulatorInstance {
  get getDevice(): GetDeviceSimulator;
  get getControl(): GetControlSimulator;
  get defineRule(): DefineRuleSimulator;
  get trackMqtt(): TrackMqttSimulator;
  defineZigbeeDevice(deviceId: string): ZigbeeDevice;
}

function createSimulator(): CoreSimulator {

  const simulators: Record<string, SimulatorInstance | undefined> = {};

  function reset() {

    for (const key in simulators)
      simulators[key]?.reset();

  }

  const getDevice = (
    simulators.getDevice ??= useGetDevice()
  ) as GetDeviceSimulator;

  const getControl = (
    simulators.getControl ??= useGetControl()
  ) as GetControlSimulator;

  const defineRule = (
    simulators.defineRule ??= useDefineRule()
  ) as DefineRuleSimulator;

  const trackMqtt = (
    simulators.trackMqtt ??= useTrackMqtt()
  ) as TrackMqttSimulator;

  // Создаем и устанавливаем прокси на dev, передавая ему зависимости.
  // Это должно быть сделано ПОСЛЕ инициализации defineRule и trackMqtt.
  simulators.dev ??= useDev({ defineRule, trackMqtt });

  simulators.defineVirtualDevice ??= useDefineVirtualDevice();

  return {
    reset,
    getDevice,
    getControl,
    defineRule,
    trackMqtt,
    defineZigbeeDevice,
  };

}

let instance: CoreSimulator | undefined;

/** Единая точка входа для настройки симуляции. */
export function useSimulator() {

  return instance ??= createSimulator();

}
