import { useEvent, type EventRaiser } from 'mirta';
import { type MqttMessageEventHandler, type SimulatorInstance } from './types';
import { setValueSilent } from './dev';

interface WithDevice {
  publish(controlId: string, value: WbRules.MqttValue): WithDevice;
}

export interface TrackMqttSimulator extends SimulatorInstance {
  /** Отправляет одно или несколько сообщений. */
  publish(payload: WbRules.MqttMessage | WbRules.MqttMessage[]): void;
  withDevice(deviceId: string): WithDevice;
}

function parseDeviceTopic(topic: string): { deviceName: string; controlName: string } | undefined {

  if (!topic.startsWith('/devices/'))
    return;

  const match = /^\/devices\/([^/]+)\/controls\/([^/]+)$/.exec(topic);

  if (!match)
    return;

  return {

    deviceName: match[1],
    controlName: match[2],

  };

}

function createInstance(): TrackMqttSimulator {

  let mqttEvent: EventRaiser<MqttMessageEventHandler>;

  function reset() {

    mqttEvent = useEvent<MqttMessageEventHandler>();

    global.trackMqtt = (topic: string, callback: (message: WbRules.MqttMessage) => void) => {

      mqttEvent.on((message) => {

        if (topic == message.topic)
          callback(message);

      });

    };

  }

  function publish(payload: WbRules.MqttMessage | WbRules.MqttMessage[]): void {

    payload = Array.isArray(payload) ? payload : [payload];

    payload.forEach((item) => {

      const parts = parseDeviceTopic(item.topic);

      if (parts) {

        // Устанавливаем значение во внутреннее состояние.
        setValueSilent(`${parts.deviceName}/${parts.controlName}`, item.value);

      }

      // Инициируем событие. Ивент не проверяет изменения, он просто вызывает коллбек.
      mqttEvent.raise(item);

    });

  }

  function withDevice(deviceId: string): WithDevice {

    return {
      publish(controlId: string, value: WbRules.MqttValue) {

        // Устанавливаем значение через publish, чтобы не дублировать логику.
        publish({
          topic: `/devices/${deviceId}/controls/${controlId}`,
          value,
        });

        return this;

      },
    };

  }

  reset();

  return {
    reset,
    publish,
    withDevice,
  };

}

let instance: TrackMqttSimulator | undefined;

/** Имитатор конструкции trackMqtt. */
export function useTrackMqtt() {

  return instance ??= createInstance();

}
