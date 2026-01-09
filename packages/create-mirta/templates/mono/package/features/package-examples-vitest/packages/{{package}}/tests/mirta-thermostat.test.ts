import { useSimulator } from '@mirta/testing'
import { useThermostat } from '#src/index'

const simulator = useSimulator()

beforeEach(() => {

  simulator.reset()

})

describe('useThermostat', () => {

  const heaterTopic = 'deviceId/heater'
  const sensorTopic = 'deviceId/sensor'

  beforeEach(() => {

    dev[heaterTopic] = false
    useThermostat({
      sensorTopic: sensorTopic,
      heaterTopic: heaterTopic,
      targetTemp: 22,
      hysteresis: 0.5,
    })

  })

  it('turns on heater when temperature drops below target', () => {

    simulator.defineRule.run({ topic: sensorTopic, value: 21 })
    expect(dev[heaterTopic]).toBe(true)

  })

  it('turns off heater when temperature above target', () => {

    dev[heaterTopic] = true

    simulator.defineRule.run({ topic: sensorTopic, value: 23 })
    expect(dev[heaterTopic]).toBe(false)

  })

  it('handles invalid temperature values', () => {

    dev[heaterTopic] = true

    simulator.defineRule.run({ topic: sensorTopic, value: 'invalid_value' })
    expect(dev[heaterTopic]).toBe(false)

  })

  it('does not toggle heater inside hysteresis band', () => {

    dev[heaterTopic] = true

    simulator.defineRule.run({ topic: sensorTopic, value: 22.4 })
    expect(dev[heaterTopic]).toBe(true)

  })

  it('does not toggle heater inside hysteresis band (heater off)', () => {

    dev[heaterTopic] = false

    simulator.defineRule.run({ topic: sensorTopic, value: 21.6 })
    expect(dev[heaterTopic]).toBe(false)

  })

})
