// Импульсные счетчики
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

import { isNumber, isString } from 'mirta'

const meterCorrection = 123120 // Корректировочное значение счетчика в литрах
const counterCorrection = 7 // Корректировочное значение WB-MCM8 в импульсах
const inpulseValue = 10 // Количество литров на один импульс

defineVirtualDevice('water_meters', { // Создаем виртуальный девайс для отображения в веб интерфейсе.
  title: 'Счетчики воды',
  cells: {
    water_meter_1: {
      type: 'value',
      value: 0,
    },
  },
})

defineRule('water_meter_1', {
  whenChanged: 'wb-mcm8_29/Input 1 counter',
  then: function (newValue) {

    if (newValue) {

      // Здесь было не совсем очевидно из оригинального примера,
      // что приходит в качестве newValue.
      //
      // Поэтому перестраховка с проверкой типов - распознаёт как строки, так и числа.

      const intValue = isString(newValue)
        ? parseInt(newValue)
        : (
            isNumber(newValue)
              ? newValue
              : 0
          )

      dev['water_meters/water_meter_1'] = ((intValue - counterCorrection) * inpulseValue) + meterCorrection // Умножаем значение счетчика на количество литров/импульс и прибавляем корректировочное значение.

    }

  },
})
