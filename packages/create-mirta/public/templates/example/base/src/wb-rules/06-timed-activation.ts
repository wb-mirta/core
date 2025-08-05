// Активация правила только в определённое время
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

const motion_timer_1_timeout_ms = 5 * 1000
let motion_timer_1_id: NodeJS.Timeout | undefined

defineRule('motion_detector_1', {
  whenChanged: 'wb-gpio/A1_IN',
  then: function (newValue) {

    const date = new Date()

    // time point marking the beginning of the interval
    // i.e. "today, at HH:MM". All dates are in UTC!
    const date_start = new Date(date)
    date_start.setHours(9)
    date_start.setMinutes(30)

    // time point marking the end of the interval
    const date_end = new Date(date)
    date_end.setHours(17)
    date_end.setMinutes(10)

    // if time is between 09:30 and 17:10 UTC
    if ((date > date_start) && (date < date_end)) {

      if (newValue) {

        dev['wb-gpio/EXT1_R3A1'] = 1

        if (motion_timer_1_id) {

          clearTimeout(motion_timer_1_id)

        }

        motion_timer_1_id = setTimeout(function () {

          dev['wb-gpio/EXT1_R3A1'] = 0
          motion_timer_1_id = void 0

        }, motion_timer_1_timeout_ms)

      }

    }

  },
})
