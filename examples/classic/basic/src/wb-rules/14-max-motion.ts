// Датчик MSW v.3, Max Motion
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

import { isNumber } from 'mirta'

defineRule('msw3_Motion', {
  whenChanged: 'wb-msw-v3_97/Max Motion',
  then: function (newValue) {

    if (!isNumber(newValue))
      return

    if (newValue > 50) {

      // TODO: Переосмыслить типизацию. Кому понравится постоянно дописывать 'as ...'?
      //
      if ((dev['wb-msw-v3_97/Illuminance'] as number) < 50) {

        dev['wb-mr3_11/K1'] = true

      }

    }
    else {

      dev['wb-mr3_11/K1'] = false

    }

  },
})
