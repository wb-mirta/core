// Датчик MSW v.3, CO2
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

import { isNumber, isString } from 'mirta'

defineRule('msw3_co2', {
  whenChanged: 'wb-msw-v3_97/CO2',
  then: function (newValue, devName) {

    // Предохранитель типов, чтобы TypeScript не ворчал почём зря.
    // TODO: Переосмыслить типизацию 'then'
    //
    if (!isNumber(newValue) || !isString(devName))
      return

    const co2_good = newValue < 650
    const co2_middle = newValue < 1000 && newValue > 651
    const co2_bad = newValue > 1001

    if (co2_good) {

      dev[devName]['/Green LED'] = true
      dev[devName]['/Red LED'] = false
      dev[devName]['/LED Period (s)'] = 10

    }

    if (co2_middle) {

      dev[devName]['/Green LED'] = true
      dev[devName]['/Red LED'] = true
      dev[devName]['/LED Period (s)'] = 5

    }

    if (co2_bad) {

      dev[devName]['/Green LED'] = false
      dev[devName]['/Red LED'] = true
      dev[devName]['/LED Period (s)'] = 1

    }

  },
})
