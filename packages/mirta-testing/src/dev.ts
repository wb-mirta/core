import { type DefineRuleSimulator } from './define-rule';
import { type TrackMqttSimulator } from './track-mqtt';
import { SimulatorInstance } from './types';

interface DevOptions {
  /** Экземпляр симулятора `defineRule` для автоматического запуска правил. */
  defineRule: DefineRuleSimulator;
  /** Экземпляр симулятора `trackMqtt` для автоматической публикации сообщений. */
  trackMqtt: TrackMqttSimulator;
}

class DevSetValueError extends Error {
  constructor(property: string) {

    super(`[dev] Missing control name in "${property}"`);

    Error.captureStackTrace(this, DevSetValueError);

  }
}

/**
 * Создаёт прокси для объекта `dev`, который автоматически реагирует
 * на изменения значений, запуская соответствующие симуляторы.
 *
 * @param options Объект с зависимостями симуляторов.
 */
export function createDev({ trackMqtt, defineRule }: DevOptions): SimulatorInstance {

  // Используем простой объект в качестве базового хранилища.
  let state: Record<string, WbRules.MqttValue>;

  const handler: ProxyHandler<Record<string, WbRules.MqttValue>> = {

    get(_target, prop: string) {

      // Прозрачное чтение значения.
      return state[prop];

    },

    set(_target, prop: string, value: WbRules.MqttValue): boolean {

      const changed = state[prop] !== value;

      // Устанавливаем новое значение в хранилище.
      if (changed)
        state[prop] = value;

      const [deviceName, controlName] = prop.split('/') as [string, string?];

      if (!controlName)
        throw new DevSetValueError(prop);

      // Оповещаем о любом обновлении.
      trackMqtt.publish({
        topic: `/devices/${deviceName}/controls/${controlName}`,
        value,
      }, {
        updateDev: false,
      });

      // Отправляем только изменённое значение.
      if (changed)
        defineRule.run({
          topic: prop,
          value,
        }, {
          updateDev: false,
          force: true,
        });

      return true;

    },
  };

  function reset() {

    state = {};
    global.dev = new Proxy(state, handler);

  }

  reset();

  // Возвращаем прокси, который будет использоваться как `global.dev`.
  return {
    reset,
  };

}

/**
 * Хранилище для экземпляра прокси, чтобы он был доступен при сбросе.
 */
let instance: SimulatorInstance | undefined;

/**
 * Возвращает инициализированный прокси для `dev`. Создает его, если он еще не существует.
 * @param options Конфигурация с зависимостями.
 */
export function useDev(options: DevOptions): SimulatorInstance {

  return instance ??= createDev(options);

}
