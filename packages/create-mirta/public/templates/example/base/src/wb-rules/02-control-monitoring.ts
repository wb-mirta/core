// Слежение за контролом
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

defineRule({
  whenChanged: 'wb-gpio/D1_IN',
  then: function (newValue) {

    dev['wb-gpio/Relay_2'] = newValue
    dev['wb-mrm2_6/Relay 1'] = newValue

  },
})

// То же самое, но с виртуальным девайсом в качестве источника событий.

defineVirtualDevice('simple_test', {
  title: 'Simple Switch',
  cells: {
    enabled: {
      type: 'switch',
      value: false,
    },
  },
})

defineRule('simple_switch', {
  whenChanged: 'simple_test/enabled',
  then: function (newValue) {

    dev['wb-gpio/Relay_2'] = newValue
    dev['wb-mrm2_6/Relay 1'] = newValue

  },
})
