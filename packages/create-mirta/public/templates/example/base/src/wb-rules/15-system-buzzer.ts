// Системные правила, пищалка
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

defineVirtualDevice('buzzer', {
  title: 'Buzzer', //

  cells: {
    frequency: {
      type: 'range',
      value: 3000,
      max: 7000,
    },
    volume: {
      type: 'range',
      value: 10,
      max: 100,
    },
    enabled: {
      type: 'switch',
      value: false,
    },
  },
})

// setup pwm2
runShellCommand('echo 2 > /sys/class/pwm/pwmchip0/export')

function _buzzer_set_params() {

  const period = 1.0 / (dev.buzzer.frequency as number) * 1E9
  const duty_cycle = (dev.buzzer.volume as number) * 1.0 / 100 * period * 0.5

  runShellCommand(`echo ${period} > /sys/class/pwm/pwmchip0/pwm2/period`)
  runShellCommand(`echo ${duty_cycle} > /sys/class/pwm/pwmchip0/pwm2/duty_cycle`)

};

defineRule('_system_buzzer_params', {
  whenChanged: [
    'buzzer/frequency',
    'buzzer/volume',
  ],

  then: function () {

    if (dev.buzzer.enabled) {

      _buzzer_set_params()

    }

  },
})

defineRule('_system_buzzer_onof', {
  whenChanged: 'buzzer/enabled',
  then: function () {

    if (dev.buzzer.enabled) {

      _buzzer_set_params()
      runShellCommand('echo 1  > /sys/class/pwm/pwmchip0/pwm2/enable')

    }
    else {

      runShellCommand('echo 0  > /sys/class/pwm/pwmchip0/pwm2/enable')

    }

  },
})
