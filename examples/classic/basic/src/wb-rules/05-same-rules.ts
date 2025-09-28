// Создание однотипных правил
//
// Адаптированная версия примера
// https://wirenboard.com/wiki/index.php?title=Rule_Examples
//
// Если таких детекторов движения нужно несколько,
// то чтобы не копировать код, можно обернуть создание
// правила и переменных в функцию:

/**
 * Создаёт правило реакции на сработку датчика движения.
 * Какой датчик и какое реле, станет известно при вызове функции.
 *
 * @param name Наименование правила.
 * @param timeout_ms Задержка срабатывания, в мс.
 * @param detector_control Идентификатор датчика.
 * @param relay_control Идентификатор реле.
 */
function makeMotionDetector(
  name: string,
  timeout_ms: number,
  detector_control: string,
  relay_control: string
) {

  let motion_timer_id: NodeJS.Timeout | undefined

  defineRule(name, {
    whenChanged: `wb-gpio/${detector_control}`,
    then: function (newValue) {

      if (!newValue) {

        dev[`wb-gpio/${relay_control}`] = true

        if (motion_timer_id) {

          clearTimeout(motion_timer_id)

        }

        motion_timer_id = setTimeout(function () {

          dev['wb-gpio/relay_control'] = false
          motion_timer_id = void 0

        }, timeout_ms)

      }

    },
  })

}

makeMotionDetector('motion_detector_1', 20000, 'EXT1_DR1', 'EXT2_R3A1')
makeMotionDetector('motion_detector_2', 10000, 'EXT1_DR2', 'EXT2_R3A2')
makeMotionDetector('motion_detector_3', 10000, 'EXT1_DR3', 'EXT2_R3A3')
