import { isNumber, isString } from './type-guards'

export const mqttToBoolean = (value: WbRules.MqttValue): boolean => {

  if (isString(value))
    return !['', '0', 'off', 'false'].includes(value)

  if (isNumber(value))
    return value !== 0

  return value

}
