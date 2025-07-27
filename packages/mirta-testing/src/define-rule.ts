import { useEvent, type Event } from 'mirta'
import { type SimulatorInstance } from './types'

class SameTopicValueError extends Error {
  constructor(message: WbRules.MqttMessage) {

    const text
      = `[Behavior] Value of the topic "${message.topic}"`
        + ` must be different from a previous one,`
        + ` got "${message.value.toString()}".`
        + `\nYou can suppress this error by passing 'allowSameValue: true' option to 'useDefineRule' call.`

    super(text)

  }
}

export interface DefineRuleOptions {
  /**
   * Отключает защиту от расхождения в поведении с настоящей функцией `defineRule`.
   *
   * Контроллер не отправляет одно и то же значение дважды при использовании `whenChanged`.
   */
  allowSameValue?: boolean
}

export interface DefineRuleSimulator extends SimulatorInstance {
  /** Отправляет одно или несколько сообщений. */
  run(payload: WbRules.MqttMessage | WbRules.MqttMessage[]): void
}

function createInstance(options: DefineRuleOptions): DefineRuleSimulator {

  let mqttEvent: Event<WbRules.MqttMessage>
  let values: Record<string, WbRules.MqttValue> = {}

  function reset() {

    mqttEvent = useEvent<WbRules.MqttMessage>()
    values = {}

    global.defineRule = (variantA: WbRules.RuleOptions | string, variantB?: WbRules.RuleOptions) => {

      const rule = typeof variantA !== 'string'
        ? variantA
        : variantB

      if (!rule)
        return

      mqttEvent.on((message) => {

        if (rule.whenChanged == message.topic)
          rule.then(message.value)

      })

    }

  }

  // Поведение движка wb-rules, отправляет только изменившиеся значения.
  function isValueChanged(message: WbRules.MqttMessage) {

    if (options.allowSameValue)
      return true

    if (values[message.topic] === message.value) {

      const error = new SameTopicValueError(message)
      Error.captureStackTrace(error, isValueChanged)
      throw error

    }

    values[message.topic] = message.value
    return true

  }

  /** Отправляет одно или несколько сообщений */
  function run(payload: WbRules.MqttMessage | WbRules.MqttMessage[]): void {

    if (!Array.isArray(payload)) {

      if (isValueChanged(payload))
        mqttEvent.raise(payload)

    }
    else {

      payload.forEach((item) => {

        if (isValueChanged(item))
          mqttEvent.raise(item)

      })

    }

  }

  reset()

  return {
    reset,
    run,
  }

}

// let instance: DefineRuleSimulator | undefined

/** Имитатор конструкции defineRule. */
export function useDefineRule(options: DefineRuleOptions = {}) {

  return /* instance ??= */ createInstance(options)

}
