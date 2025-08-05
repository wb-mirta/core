// Мастер-выключатель с восстановлением последнего состояния
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

defineVirtualDevice('power_off', {
  title: 'Мастер-выключатель',
  cells: {
    power_off: {
      type: 'pushbutton',
    },
  },
})

const ps = new PersistentStorage('power-storage', { global: true })

// Для обеспечения возможности распознавания обращения
// к контролу в dev, после массива добавляется 'as const'.

const lights = [
  'wb-mdm3_50/K1',
  'wb-mdm3_50/K2',
  'wb-mdm3_50/K3',
] as const

let isPowerOff = true

defineRule({
  whenChanged: ['wb-gpio/A1_IN', 'power_off/power_off'],
  then: function () {

    if (isPowerOff) {

      lights.forEach(function (light) {

        ps[light] = dev[light]
        dev[light] = false

      })

    }
    else {

      lights.forEach(function (light) {

        dev[light] = ps[light] as WbRules.MqttValue

      })

    }

    isPowerOff = !isPowerOff

  },
})
