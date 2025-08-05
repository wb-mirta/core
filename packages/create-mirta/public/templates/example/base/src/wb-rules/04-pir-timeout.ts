// Детектор движения c таймаутом
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

const motion_timer_1_timeout_ms = 30 * 1000
let motion_timer_1_id: NodeJS.Timeout | undefined

defineRule('motion_detector_1', {
  whenChanged: 'wb-gpio/D2_IN',
  then: function (newValue) {

    // Обнаружено движение
    if (newValue) {

      // Включаем свет
      dev['wb-gpio/Relay_1'] = true

      if (motion_timer_1_id)
        clearTimeout(motion_timer_1_id)

      motion_timer_1_id = setTimeout(function () {

        // Выключаем свет
        dev['wb-gpio/Relay_1'] = false

        // Очистка идентификатора таймера.
        // (прим. void 0 - то же самое, что и undefined).
        //
        motion_timer_1_id = void 0

      }, motion_timer_1_timeout_ms)

    }

  },
})
