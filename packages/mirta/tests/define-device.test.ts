import { defineVirtualDevice, type PropType } from '../src'

describe('Define Virtual Device Functionality Tests', () => {

  beforeEach(() => {

    global.defineVirtualDevice = vi.fn()
    global.trackMqtt = vi.fn()
    global.getControl = vi.fn()

  })

  it('Should create device with given shape', () => {

    interface BatteryProps {
      lowValue: number
      criticalValue: number
    }

    const useDevice = defineVirtualDevice({
      setup: ({ props }) => {

        let value = props.battery.lowValue

        return {
          get value() {

            return value

          },

          increment() {

            value += 1

          },
        }

      },
      props: {
        battery: {
          type: Object as PropType<BatteryProps>,
          isRequired: true,
        },
      },
      controls: {
        // В этом тесте - без контролов.
      },
    })

    const device = useDevice('my_device', {
      battery: {
        lowValue: 10,
        criticalValue: 5,
      },
    })

    device.increment()

    expect(device.value).toBe(11)

  })

  it('Should use prop default value', () => {

    interface BatteryProps {
      lowValue: number
      criticalValue: number
    }

    const useDevice = defineVirtualDevice({
      setup: ({ props }) => {

        let value = props.battery.lowValue

        return {
          get value() {

            return value

          },

          increment() {

            value += 1

          },
        }

      },
      props: {
        battery: {
          type: Object as PropType<BatteryProps>,
          // Функция-обёртка обеспечивает отложённое вычисление значения (on-demand)
          defaultValue: () => ({
            lowValue: 10,
            criticalValue: 5,
          }),
        },
      },
      controls: {
        // В этом тесте - без контролов.
      },
    })

    const device = useDevice('my_device')

    device.increment()

    expect(device.value).toBe(11)

  })

})
