// Виртуальное устройство
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

const deviceName = 'my-virtual-device'

defineVirtualDevice(deviceName, {
  title: { 'en': 'My Virtual Device', 'ru': 'Мое виртуальное устройство' },
  cells: {
    value: {
      title: { 'en': 'Value', 'ru': 'Значение' },
      type: 'range',
      value: 1,
      min: 1,
      max: 3,
    },
    state: {
      title: { 'en': 'State', 'ru': 'Состояние' },
      type: 'value',
      value: 1,
      enum: {
        1: { 'en': 'Normal', 'ru': 'В норме' },
        2: { 'en': 'Warning', 'ru': 'Внимание' },
        3: { 'en': 'Crash', 'ru': 'Авария' } },
    },
  },
})

defineRule({
  whenChanged: deviceName + '/value',
  then: function (newValue) {

    dev[`${deviceName}/state`] = newValue

  },
})
