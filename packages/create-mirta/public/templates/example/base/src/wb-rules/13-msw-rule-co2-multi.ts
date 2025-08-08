// Датчик MSW v.3, CO2 - несколько датчиков сразу
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

import { isNumber } from 'mirta'

function ruleCO2(devCO2: string, minCO2: number, maxCO2: number) {

  log.debug('rule create', devCO2)
  defineRule ('ruleCO2' + devCO2, {
    whenChanged: devCO2 + '/CO2',
    then: function (newValue) {

      if (!isNumber(newValue))
        return

      log.info('ruleCO2 ' + devCO2 + ' enter with', newValue)
      if (newValue < minCO2) {

        dev[devCO2]['LED Glow Duration (ms)'] = 50
        dev[devCO2]['Green LED'] = true
        dev[devCO2]['Red LED'] = false
        dev[devCO2]['LED Period (s)'] = 3

      }
      if ((newValue > minCO2) && (newValue < maxCO2)) {

        dev[devCO2]['LED Glow Duration (ms)'] = 50
        dev[devCO2]['Green LED'] = true
        dev[devCO2]['Red LED'] = true
        dev[devCO2]['LED Period (s)'] = 2

      }
      if (newValue > maxCO2) {

        dev[devCO2]['LED Glow Duration (ms)'] = 50
        dev[devCO2]['Green LED'] = false
        dev[devCO2]['Red LED'] = true
        dev[devCO2]['LED Period (s)'] = 1

      }

    },
  })

}

ruleCO2('wb-msw-v3_97', 650, 1000)
ruleCO2('wb-msw-v3_98', 650, 1000)
ruleCO2('wb-msw-v3_11', 500, 700)
