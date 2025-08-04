/** Типы и интерфейсы правил wb-rules */
declare namespace WbRules {

  /** Расширение для поддержки module.static */
  type ModuleStatic = Record<string, unknown>

  type LogFunc = (
    message: string | undefined, ...args: (string | number | boolean)[]
  ) => void

  interface Log {
    /**
     * Запись в лог информационного сообщения, полезного в долгосрочной перспективе.
     * @param message
     * @param args
     */
    (message: string | undefined, ...args: (string | number | boolean)[]): void

    /**
     * Запись в лог сообщения, полезного при отладке в процессе разработки и не представляющего ценности в долгосрочной перспективе.
     * @param message
     * @param args
     */
    debug(message: unknown, ...args: (string | number | boolean)[]): void

    /**
     * Запись в лог информационного сообщения, полезного в долгосрочной перспективе.
     * @param message
     * @param args
     */
    info(message: string | undefined, ...args: (string | number | boolean)[]): void

    /**
     * Запись ненормального или неожиданного события в потоке приложения, но не прекращение выполнения.
     * @param message
     * @param args
     */
    warning(message: string | undefined, ...args: (string | number | boolean)[]): void

    /**
     * Запись события остановки выполнения из-за сбоя текущего действия.
     * @param message
     * @param args
     */
    error(message: string | undefined, ...args: (string | number | boolean)[]): void
  }

  type DevControl = Record<string, unknown>
  type Dev = Record<string, DevControl | undefined>

  interface Timer {
    firing: boolean

    stop(): void
  }

  type TimerCollection = Record<string, Timer>

  /** Тип значения топика MQTT. */
  type MqttValue = string | number | boolean

  interface MqttMessage {
    topic: string
    value: MqttValue
  }

  /**
   * Объект описания правила
   */
  interface RuleOptions {
    /**
     * Поле или список полей, которые необходимо отслеживать
     */
    whenChanged?: string[] | string

    /**
     * Правило срабатывает, когда значение, возвращаемое функцией, меняется с false на true.
     */
    asSoonAs?(): boolean

    /**
     * Функция, которая сигнализирует, что правило должно отработать
     */
    when?(): number | boolean

    /**
     * Функция, которая вызывается при срабатывании правила
     * @param newValue Новое значение
     * @param deviceId Устройство, сгенерировавшее событие
     * @param controlId Поле, по которому произошло событие
     */
    then(
      newValue?: MqttValue,
      deviceId?: string,
      controlId?: string
    ): void
  }

  enum ControlType {
    SWITCH = 'switch',
    ALARM = 'alarm',
    PUSHBUTTON = 'pushbutton',
    RANGE = 'range',
    RGB = 'rgb',
    TEXT = 'text',
    VALUE = 'value'
  }

  /**
   * Объект настроек передаваемого в контрол значения.
   */
  interface ControlValueOptions {
    /**
     * Значение контрола
     */
    value: string | number | boolean

    /**
     * Уведомить правила об изменении значения,
     * по умолчанию - `true`.
     */
    notify?: boolean
  }

  /**
   * Контрол устройства
   */
  interface Control {
    /**
     * Устанавливает заголовок.
     * @param title
     */
    setTitle(title: string): void

    /**
     * Устанавливает описание.
     * @param description
     */
    setDescription(description: string): void

    /**
     * Устанавливает тип значения.
     * @param type Тип значения.
     * @see ControlType
     */
    setType(controlType: ControlType): void

    setUnits(units: string): void

    setReadonly(isReadonly: boolean): void

    setMax(max: number): void

    setMin(min: number): void

    setError(order: number): void

    setValue(value: MqttValue | ControlValueOptions): void

    getId(): string

    getTitle(): string

    getDescription(): string

    getType(): string

    getUnits(): string

    getReadonly(): boolean

    getMax(): number

    getMin(): number

    getError(): string

    getOrder(): number

    getValue(): string | number | boolean
  }

  /**
   * Конфигурация контрола.
   */
  interface ControlOptions {
    /**
     * имя, публикуемое в MQTT-топике
     */
    title?: string
    /**
     * тип, публикуемый в MQTT-топике
     * @see ControlType
     */
    type: string
    /**
     * значение параметра по умолчанию
     */
    value?: string | number | boolean
    /**
     * когда задано истинное значение, при запуске контроллера параметр всегда устанавливается в значение по умолчанию.
     * Иначе он будет установлен в последнее сохранённое значение.
     */
    forceDefault?: boolean
    /**
     * когда задано истинное значение, параметр объявляется read-only
     */
    readonly?: boolean
    precision?: number
    /**
     * когда задано истинное значение, при описании контрола в коде фактическое создание его в mqtt происходить
     * не будет до тех пор, пока этому контролу не будет присвоено какое-то значение
     * (например dev[deviceID][controlID] = "string")
     */
    lazyInit?: boolean
    /**
     * Порядок следования полей
     */
    order?: number
    /**
     * для параметра типа range может задавать его максимально допустимое значение
     */
    max?: number
    /**
     * для параметра типа range может задавать его минимально допустимое значение
     */
    min?: number
  }

  /**
   * Интерфейс устройства
   */
  interface Device {
    getId(): string

    getCellId(cellName: string): string

    addControl(cellName: string, description: ControlOptions): void

    removeControl(cellName: string): void

    getControl(cellName: string): Control

    isControlExists(cellName: string): boolean

    controlsList(): Control[]

    isVirtual(): boolean
  }

  type ControlOptionsTree = Record<string, ControlOptions>

  interface DeviceOptions {
    title: string
    cells: ControlOptionsTree
  }

  /**
   * Функция, вызываемая при завершении процесса
   * @param exitCode код возврата процесса
   * @param capturedOutput захваченный stdout процесса в виде строки в случае, когда задана опция captureOutput
   * @param capturedErrorOutput захваченный stderr процесса в виде строки в случае, когда задана опция captureErrorOutput
   */
  type ExitCallback = (
    exitCode: number,
    capturedOutput?: string,
    capturedErrorOutput?: string
  ) => void

  interface SpawnOptions {
    /**
     * Если true, захватить stdout процесса и передать его в виде строки в exitCallback
     */
    captureOutput?: boolean
    /**
     * Если true, захватить stderr процесса и передать его в виде строки в exitCallback.
     * Если данный параметр не задан, то stderr дочернего процесса направляется в stderr процесса wb-rules
     */
    captureErrorOutput?: boolean
    /**
     * Строка, которую следует использовать в качестве содержимого stdin процесса
     */
    input?: string

    /**
     * Функция, вызываемая при завершении процесса
     */
    exitCallback?: ExitCallback
  }

  interface ReadConfigOptions {
    logErrorOnNoFile: boolean
  }

  interface StorageOptions {
    global: boolean
  }
}

declare namespace NodeJS {
  interface Module {
    /**
       * Хранит данные, общие для всех экземпляров данного модуля.
      */
    static: WbRules.ModuleStatic
  }
}

declare var log: WbRules.Log

/**
 * Объект доступа к MQTT-топикам устройства
 */
declare var dev: WbRules.Dev

/**
 * Объект доступа к именованным таймерам
 */
declare var timers: WbRules.TimerCollection

/**
 * Создаёт правило обработки.
 * @param ruleName Название правила.
 * @param options Конфигурация правила.
 */
declare function defineRule(name: string, options: WbRules.RuleOptions): void
/**
 * Создаёт анонимное правило обработки.
 * @param options Конфигурация правила.
 */
declare function defineRule(options: WbRules.RuleOptions): void

/**
 * Создаёт виртуальное устройство.
 * @param deviceId Идентификатор устройства.
 * @param options Конфигурация устройства.
 */
declare function defineVirtualDevice(
  deviceId: string,
  options: WbRules.DeviceOptions
): WbRules.Device

/**
 * Позволяет получить объект для работы с указанным устройством.
 * @param deviceId Идентификатор устройства.
 */
declare function getDevice(deviceId: string): WbRules.Device | undefined

/**
 * Позволяет получить объект для работы с указанным контролом устройства.
 * @param controlPath Строка в формате "deviceId/controlId"
 */
declare function getControl(controlPath: string): WbRules.Control | undefined

/**
 * Запускает периодический таймер с указанным интервалом.
 *
 * К таймеру можно обратиться через `timers.<name>` внутри when при работе с `defineRule`.
 *
 * @param name Идентификатор таймера в глобальном наборе `timers`.
 * @param delay Интервал срабатывания, в миллисекундах
 */
declare function startTicker(name: string, interval: number): void

/**
 * Запускает однократный таймер с указанным именем,
 * к которому можно обратиться через `timers.<name>`,
 *
 * см. [руководство по однократным таймерам](https://github.com/wirenboard/wb-rules?tab=readme-ov-file#однократные)
 *
 * @param name Идентификатор таймера в глобальном наборе `timers`.
 * @param delay
 *
 * Используется при работе с определениями правил:
 *
 * @example
 * ```ts
 * defineRule('1', {
 *   asSoonAs: () => dev['test_buzzer/enabled'],
 *   then: () => {
 *     startTimer('one_second', 1000)
 *     dev['buzzer/enabled'] = true
 *   }
 * })
 *
 * defineRule('2', {
 *   when: () => timers.one_second.firing,
 *   then: () => {
 *     dev['buzzer/enabled'] = false
 *     dev['test_buzzed/enabled'] = false
 *   }
 * })
 *
 * ```
 *
 */
declare function startTimer(name: string, delay: number): void

/**
 * Запуск внешних процессов
 * @param cmd
 * @param args
 * @param options
 */
declare function spawn(
  cmd: string,
  args: string[],
  options: WbRules.SpawnOptions | WbRules.ExitCallback
): void

declare function runShellCommand(
  command: string,
  options: WbRules.SpawnOptions | WbRules.ExitCallback
): void

declare function readConfig(
  fileName: string,
  options?: WbRules.ReadConfigOptions
): object

/**
 *
 * @param alias Альтернативное наименование для контрола.
 * @param controlPath Путь к контролу устройства в формате `deviceId/controlId`
 *
 * @example
 * ```ts
 * defineAlias('heaterOn', 'Relays/Relay 1')
 * ```
 */
declare function defineAlias(alias: string, controlPath: string): void

/**
 * Следует учесть, что функция format и xformat съедают одинарные квадратные скобки!
 * Поэтому, если необходимо их вывести, то нужно дублировать.
 */
interface String {
  format(...args: (string | number | boolean)[]): string
  xformat(...args: (string | number | boolean)[]): string
}

/**
 * Подписаться на топик (допустимы символы # и +)
 * @param topic
 * @param callback
 */
declare function trackMqtt(
  topic: string,
  callback: (message: WbRules.MqttMessage) => void
): void

/**
 * Публикация сообщений в MQTT
 * Важно: не используйте publish() для изменения значения параметров устройств.
 * @param topic
 * @param payload
 * @param QoS
 * @param retain
 */
declare function publish(
  topic: string,
  value: WbRules.MqttValue,
  QoS?: number,
  retain?: boolean
): void

declare class PersistentStorage {
  constructor(name: string, options: WbRules.StorageOptions)
}

/**
 * Класс оповещения
 * @abstract
 */
declare abstract class Notify {
  /**
   * Отправляет почту указанному адресату
   * @static
   * @param to адресат
   * @param subject тема
   * @param text содержимое
   * @memberof Notify
   */
  static sendEmail(to: string, subject: string, text: string): void

  /**
   * Отправляет SMS на указанный номер
   * Для отправки SMS используется ModemManager, а если он не установлен, то gammu.
   * @static
   * @param to номер адресата
   * @param text содержимое
   * @param command используя команду
   * @memberof Notify
   */
  static sendSMS(to: string, text: string, command?: string): void
}
