// Инвертирование значения контрола
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

defineVirtualDevice('my-invert-buzzer', {
  title: 'Buzzer Invert',
  cells: {
    Disabled: {
      title: 'disabled',
      type: 'switch',
      value: !dev['buzzer/enabled'],
    },
  },
})

defineRule({
  whenChanged: ['buzzer/enabled'],
  then: function (newValue) {

    dev['my-invert-buzzer/Disabled'] = !newValue

  },
})

defineRule({
  whenChanged: ['my-invert-buzzer/Disabled'],
  then: function (newValue) {

    dev['buzzer/enabled'] = !newValue

  },
})
