// Подсчет импульсов на дискретном входе
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples

import { isNumber } from 'mirta'

// --- Виртуальное устройство для отображения количества импульсов с кнопкой сброса ---
defineVirtualDevice('pulse_counter', {
  title: 'Pulse counter',
  cells: {
    impulses: {
      type: 'value',
      value: 0,
    },
    reset: {
      type: 'pushbutton',
    },
  },
})

// --- Логика подсчета импульсов ---
let impulseCount = 0 // Счетчик импульсов
let lastInputState = 0 // Последнее состояние входа
const inputChannel = 'wb-gpio/MOD1_IN2' // Топик дискретного входа

// Обработка импульсов: с 0 на 1
defineRule('count_impulses', {
  whenChanged: inputChannel, // Правило срабатывает при любом изменении на дискретном входе, с 0 на 1 и наоборот
  then: function (newValue) {

    // Сужение диапазона типов до number.
    if (!isNumber(newValue))
      return

    if (lastInputState == 0 && newValue == 1) { // Проверка фронта импульса с 0 на 1

      impulseCount += 1 // Счетчик импульсов
      dev['pulse_counter']['impulses'] = impulseCount // Отображение импульсов в виртуальном устройстве

    }

    lastInputState = newValue // Сохранение значения фронта импульса, используется в условии выше

  },
})

// Обработка кнопки сброса
defineRule('reset_counter', {
  whenChanged: 'pulse_counter/reset',
  then: function () {

    impulseCount = 0 // Сброс счетчика
    dev['pulse_counter']['impulses'] = impulseCount

  },
})
