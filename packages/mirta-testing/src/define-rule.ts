import { useEvent, type EventRaiser } from 'mirta';
import { type MqttMessageEventHandler, type SimulatorInstance } from './types';

interface RunOptions {

  force?: boolean;

  updateDev?: boolean;

}

export interface DefineRuleSimulator extends SimulatorInstance {

  /** Отправляет одно или несколько сообщений. */
  run(payload: WbRules.MqttMessage | WbRules.MqttMessage[], options?: RunOptions): void;

}

function createInstance(): DefineRuleSimulator {

  let mqttEvent: EventRaiser<MqttMessageEventHandler>;

  function reset() {

    mqttEvent = useEvent<MqttMessageEventHandler>();

    global.defineRule = (variantA: WbRules.RuleOptions | string, variantB?: WbRules.RuleOptions) => {

      const rule = typeof variantA !== 'string'
        ? variantA
        : variantB;

      if (!rule)
        return 0 as WbRules.RuleHandle;

      mqttEvent.on(({ topic, value }) => {

        if (rule.whenChanged === topic)
          rule.then(value);

      });

      return 0 as WbRules.RuleHandle;

    };

  }

  /** Отправляет одно или несколько сообщений */
  function run(payload: WbRules.MqttMessage | WbRules.MqttMessage[], options: RunOptions = {}): void {

    const { force = false, updateDev = true } = options;

    payload = Array.isArray(payload) ? payload : [payload];

    payload.forEach((item) => {

      if (dev[item.topic] === item.value && !force) {

        // Значение не изменилось, симуляторы не запускаем.
        return;

      }

      if (updateDev) {

        // Устанавливаем значение во внутреннее состояние.
        dev[item.topic] = item.value;

      }

      // Инициируем событие. Ивент не проверяет изменения, он просто вызывает коллбек.
      mqttEvent.raise(item);

    });

  }

  reset();

  return {
    reset,
    run,
  };

}

// let instance: DefineRuleSimulator | undefined

/** Имитатор конструкции defineRule. */
export function useDefineRule() {

  return /* instance ??= */ createInstance();

}
