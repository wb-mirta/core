import { defineVirtualDevice, type PropType } from '../src'
import { mock } from 'vitest-mock-extended'

describe('Define Virtual Device Functionality Tests', () => {

  let getControlRequestCount = 0

  beforeEach(() => {

    global.defineVirtualDevice = vi.fn()
    global.trackMqtt = vi.fn()

    const getControlMock = mock<WbRules.Control>()

    getControlMock.getValue.mockImplementation(() => {

      getControlRequestCount += 1

      return 0

    })

    global.getControl = () => getControlMock

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

  it('Should force default', () => {

    const useDevice = defineVirtualDevice({
      setup: ({ controls }) => {

        return {
          count: controls.count,
        }

      },
      controls: {
        count: {
          type: 'value',
          defaultValue: 0,
          forceDefault: true,
        },
      },
    })

    const device = useDevice('my_device')

    const value = device.count.value

    expect(value).toBe(0)
    expect(getControlRequestCount).toBe(0)

  })

  it('Should not call getControl when lazyInit', () => {

    const useDevice = defineVirtualDevice({
      setup: ({ controls }) => {

        return {
          count: controls.count,
        }

      },
      controls: {
        count: {
          type: 'value',
          lazyInit: true,
        },
      },
    })

    const device = useDevice('my_device')

    const value = device.count.value

    expect(value).toBeUndefined()
    expect(getControlRequestCount).toBe(0)

  })

})
