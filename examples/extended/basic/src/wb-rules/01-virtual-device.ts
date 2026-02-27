// Виртуальное устройство
//
// Модифицированная версия примера (синтаксис Мирты)
// https://wiki.wirenboard.com/wiki/index.php?title=Rule_Examples

import { ChangePolicies, defineVirtualDevice } from 'mirta';

// Определяем структуру виртуального девайса в формате Composable.
const useMyDevice = defineVirtualDevice({
  setup: ({ controls: { value, state } }) => {

    value.onValueChanged((newValue) => {

      state.value = newValue;

    });

    // Возвращаемый объект определяет публичную структуру
    // будущего девайса.
    //
    // Может содержать любые свойства и вспомогательные методы.
    //
    return {

      // Ретранслируем наружу один из контролов,
      // другой остаётся приватным.
      //
      value,

      // Вспомогательный метод управления состоянием.
      //
      setNormal: () => {

        value.value = 1;

      },
    };

  },
  controls: {
    value: {
      title: { 'en': 'Value', 'ru': 'Значение' },
      type: 'range',
      defaultValue: 1,
      min: 1,
      max: 3,
    },
    state: {
      title: { 'en': 'State', 'ru': 'Состояние' },
      type: 'value',
      changePolicy: ChangePolicies.Script,
      defaultValue: 1,
      enum: {
        1: { 'en': 'Normal', 'ru': 'В норме' },
        2: { 'en': 'Warning', 'ru': 'Внимание' },
        3: { 'en': 'Crash', 'ru': 'Авария' } },
    },
  },
});

// Создаём виртуальный девайс с уникальным именем.
// Повторный вызов с тем же именем вернёт тот же объект.
//
const myDevice = useMyDevice('my-virtual-device');

// Можно подписаться на изменения значения контрола
// отдельно от базовой логики.
//
myDevice.value.onValueChanged((newValue) => {

  log.debug(`Значение обновилось: ${newValue}`);

});

// Устанавливаем нормальное состояние при запуске.
myDevice.setNormal();
