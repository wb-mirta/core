import { mock } from 'vitest-mock-extended'
import { ChangePolicies, createControl } from '../src/control'

describe('Control tests', () => {

  beforeEach(() => {

    global.trackMqtt = vi.fn()
    global.getControl = vi.fn()
    global.log = mock<WbRules.Log>()

  })

  it('Should return 0', () => {

    const control = createControl(
      {
        deviceType: 'virtual',
        deviceId: 'my_device',
        isReady: true,
      },
      'my_control',
      {
        type: 'value',
        defaultValue: 0,
        forceDefault: true,
      }
    )

    expect(control.value).toBe(0)

  })

  it('Should handle value changes', () => {

    const control = createControl(
      {
        deviceType: 'virtual',
        deviceId: 'my_device',
        isReady: true,
      },
      'my_control',
      {
        type: 'value',
        defaultValue: 0,
        forceDefault: true,
      }
    )

    expect(control.value).toBe(0)

    // Событие получения значения.
    control.onValueReceived((newValue) => {

      expect(newValue).toBe(10)

    })

    // Событие изменения значения.
    control.onValueChanged((newValue) => {

      expect(newValue).toBe(10)

    })

    control.value = 10

  })

  it('Should respect readonly', () => {

    const control = createControl(
      {
        deviceType: 'virtual',
        deviceId: 'my_device',
        isReady: true,
      },
      'my_control',
      {
        type: 'value',
        changePolicy: ChangePolicies.ReadOnly,
        defaultValue: 0,
        forceDefault: true,
      }
    )

    // @ts-expect-error Cannot assign to 'value' because it is a read-only property.
    control.value = 10

    expect(control.value).toBe(0)

  })

})
