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

})
