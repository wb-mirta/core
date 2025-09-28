// Обработка счётчиков нажатий
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

/* ---------------------------------- */
/* 1. Single Press Counter: On action */
/* ---------------------------------- */

defineRule({
  whenChanged: 'wb-mcm8_20/Input 1 Single Press Counter',
  then: function () {

    dev['wb-mdm3_58/K1'] = true

  },
})

/* ----------------------------------- */
/* 2. Double Press Counter: Off action */
/* ----------------------------------- */

defineRule({
  whenChanged: 'wb-mcm8_20/Input 1 Double Press Counter',
  then: function () {

    dev['wb-mdm3_58/K1'] = false

  },
})

/* ------------------------------------------ */
/* 3. Long Press Counter: Increase brightness */
/* ------------------------------------------ */

defineRule({
  whenChanged: 'wb-mcm8_20/Input 1 Long Press Counter',
  then: function () {

    // Start a timer that will increase the value of the control
    startTicker('input1_long_press', 75)

  },
})

// A rule that will increase the brightness on a timer
defineRule({
  when: function () {

    return timers.input1_long_press.firing

  },
  then: function () {

    let i = dev['wb-mdm3_58/Channel 1'] as number

    if (i < 100 && dev['wb-mcm8_20/Input 1']) {

      i += 1

      dev['wb-mdm3_58/Channel 1'] = i

    }
    else {

      timers.input1_long_press.stop()

    }

  },
})

/* ------------===-------------------------------- */
/* 4. Shortlong Press Counter: Decrease brightness */
/* ---------------===----------------------------- */

defineRule({
  whenChanged: 'wb-mcm8_20/Input 1 Shortlong Press Counter',
  then: function () {

    // Start a timer that will decrease the value of the control
    startTicker('input1_shortlong_press', 75)

  },
})

// A rule that will decrease the brightness on a timer
defineRule({
  when: function () {

    return timers.input1_shortlong_press.firing

  },
  then: function () {

    let i = dev['wb-mdm3_58/Channel 1'] as number

    if (i > 0 && dev['wb-mcm8_20/Input 1']) {

      i -= 1

      dev['wb-mdm3_58/Channel 1'] = i

    }
    else {

      timers.input1_shortlong_press.stop()

    }

  },
})
