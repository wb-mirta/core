import { useEvent, type EventRaiser } from 'mirta';
import { type MqttMessageEventHandler, type SimulatorInstance } from './types';

interface PublishOptions {
  updateDev?: boolean;
}

interface WithDevice {
  publish(controlId: string, value: WbRules.MqttValue): WithDevice;
}

export interface TrackMqttSimulator extends SimulatorInstance {
  /** Отправляет одно или несколько сообщений. */
  publish(payload: WbRules.MqttMessage | WbRules.MqttMessage[], options?: PublishOptions): void;
  withDevice(deviceId: string): WithDevice;
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

  function publish(payload: WbRules.MqttMessage | WbRules.MqttMessage[], options: PublishOptions = {}): void {

    const { updateDev = true } = options;

    payload = Array.isArray(payload) ? payload : [payload];

    payload.forEach((item) => {

      if (updateDev) {

        // Устанавливаем значение напрямую во внутреннее состояние.
        dev[item.topic] = item.value;

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
