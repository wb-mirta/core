import { createControl } from '../src/control'

describe('Control tests', () => {

  beforeEach(() => {

    global.trackMqtt = vi.fn()
    global.getControl = vi.fn()

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

})
