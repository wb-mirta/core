// Роллеты
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

const suffix = '1' // must be different in different JS files

const relay_up = 'lc103_4/Relay 1'
const relay_down = 'lc103_4/Relay 2'

const timeout_s = 15

// End of settings

let relay_up_timer_id: NodeJS.Timeout | undefined
let relay_down_timer_id: NodeJS.Timeout | undefined

defineRule('roller_shutter_up_on' + suffix, {
  asSoonAs: function () {

    return dev[relay_up] as boolean

  },
  then: function () {

    if (relay_up_timer_id) {

      clearTimeout(relay_up_timer_id)

    };

    relay_up_timer_id = setTimeout(function () {

      return dev[relay_up] = 0

    }, timeout_s * 1000)

  },
})

defineRule('roller_shutter_down_on' + suffix, {
  asSoonAs: function () {

    return dev[relay_down] as boolean

  },
  then: function () {

    if (relay_down_timer_id) {

      clearTimeout(relay_down_timer_id)

    };

    relay_down_timer_id = setTimeout(function () {

      dev[relay_down] = 0

    }, timeout_s * 1000)

  },
})

defineRule('roller_shutter_both_on' + suffix, {
  asSoonAs: function () {

    return dev[relay_up] as boolean
      && dev[relay_down] as boolean

  },
  then: function () {

    if (relay_up_timer_id)
      clearTimeout(relay_up_timer_id)

    if (relay_down_timer_id)
      clearTimeout(relay_down_timer_id)

    dev[relay_up] = 0
    dev[relay_down] = 0

    log('Both roller shutter relays on, switching them off')

  },
})
