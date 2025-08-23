import { mqttToBoolean } from '../src/mqtt-converters'

describe('MQTT Converter tests', () => {

  it('Should convert empty string to false', () => {

    const value: WbRules.MqttValue = ''
    const result = mqttToBoolean(value)

    expect(result).toBeFalsy()

  })

  it('Should convert string "0" to false', () => {

    const value: WbRules.MqttValue = '0'
    const result = mqttToBoolean(value)

    expect(result).toBeFalsy()

  })

  it('Should convert string "off" to false', () => {

    const value: WbRules.MqttValue = 'off'
    const result = mqttToBoolean(value)

    expect(result).toBeFalsy()

  })

  it('Should convert string "false" to false', () => {

    const value: WbRules.MqttValue = 'false'
    const result = mqttToBoolean(value)

    expect(result).toBeFalsy()

  })

  it('Should convert any other string to true', () => {

    const value: WbRules.MqttValue = 'other value'
    const result = mqttToBoolean(value)

    expect(result).toBeTruthy()

  })

  it('Should convert number 0 to false', () => {

    const value: WbRules.MqttValue = 0
    const result = mqttToBoolean(value)

    expect(result).toBeFalsy()

  })

  it('Should convert number 1 to true', () => {

    const value: WbRules.MqttValue = 1
    const result = mqttToBoolean(value)

    expect(result).toBeTruthy()

  })

})
