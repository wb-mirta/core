/**
 * Используется для нормализации составных типов.
 *
 * @example
 * ```ts
 * interface A { value: number }
 * interface B { isReadonly: boolean }
 *
 * type C = A & B
 * // A & B
 *
 * type D = Expand<A & B>
 * // {
 * //   value: number;
 * //   isReadonly: boolean;
 * // }
 * ```
 * @since 0.0.4
 *
 **/
declare type Expand<T> = { [K in keyof T]: T[K] } & {}

/** Типы и интерфейсы правил wb-rules */
declare namespace WbRules {

  /** Расширение для поддержки module.static */
  type ModuleStatic = Record<string, unknown>

  /**
   * Набор методов для логирования.
   *
   * @since 0.3.2
   *
   **/
  interface LogMethods {

    /**
     * Запись в лог информационного сообщения, полезного в долгосрочной перспективе.
     * Используется форматированный вывод.
     *
     * @param format Форматируемый шаблон сообщения.
     * @param args Параметры для заполнения формата.
     *
     * @example
     * ```ts
     * log.info('Свет в комнате включён на {} мин.', 30)
     * ```
     **/
    info(format: string, ...args: unknown[]): void

    /**
     * Запись в лог произвольного значения, полезного в долгосрочной перспективе.
     * @param value Значение для записи в лог.
     *
     **/
    info(value: unknown): void

    /**
     * Запись в лог сообщения, полезного при отладке и не имеющего долгосрочной ценности.
     *
     * @param format Форматируемый шаблон сообщения.
     * @param args Параметры для заполнения формата.
     *
     * @example
     * ```ts
     * log.debug('Значение сенсора "{}": температура {} °C, влажность {} %', 'bathroom', 25, 40)
     **/
    debug(format: string, ...args: unknown[]): void

    /**
     * Запись в лог произвольного значения, полезного при отладке и не имеющего долгосрочной ценности.
     *
     * @param value Значение для записи в лог.
     *
     * @example
     * ```ts
     * log.debug(JSON.stringify({ location: 'bathroom', temperature: 25, humidity: 40 }))
     * ```
     **/
    debug(value: unknown): void

    /**
     * Запись в лог предупреждения о ненормальном или неожиданном событии,
     * не приводящем к остановке программы.
     *
     * Используется форматированный вывод.
     *
     * @param format Форматируемый шаблон сообщения.
     * @param args Параметры для заполнения формата.
     *
     * @example
     * ```ts
     * log.warning('Движение в охраняемой зоне: {}', 'hallway_sensor_1')
     * ```
     **/
    warning(format: string, ...args: unknown[]): void

    /**
     * Запись в лог предупреждения о ненормальном или неожиданном значении,
     * не приводящем к остановке программы.
     *
     * @param value Значение для записи в лог.
     *
     **/
    warning(value: unknown): void

    /**
     * Запись в лог критического события, приведшего к сбою и остановке выполнения.
     * Используется форматированный вывод.
     *
     * @param format Форматируемый шаблон сообщения.
     * @param args Параметры для заполнения формата.
     *
     * @example
     * ```ts
     * log.error('Перегев тёплого пола: {} °C, выключение', 30)
     * ```
     **/
    error(format: string, ...args: unknown[]): void

    /**
     * Запись в лог критического значения, приведшего к сбою и остановке выполнения.
     *
     * @param value Значение для записи в лог.
     *
     **/
    error(value: unknown): void
  }

  /** @deprecated since version 0.3.2 */
  type LogFunc = (format: string, ...args: unknown[]) => void

  type Log = LogMethods['info'] & LogMethods

  type Debug = LogMethods['debug']

  interface CronEntry {
    spec: string
  }

  interface Timer {
    firing: boolean

    stop(): void
  }

  type TimerCollection = Record<string, Timer>

  /** Тип значения топика MQTT. */
  type MqttValue = string | number | boolean

  type Dev = Record<string, MqttValue | Record<string, MqttValue>>

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
     * Функция или экземпляр {@link CronEntry}, возвращаемый функцией {@link cron}.
     *
     * Сигнализирует, когда правило должно отработать.
     *
     **/
    when?: CronEntry | (() => number | boolean)

    /**
     * Функция, которая вызывается при срабатывании правила
     * @param newValue Новое значение
     * @param deviceId Устройство, сгенерировавшее событие
     * @param controlId Поле, по которому произошло событие
     */
    then(
      newValue: MqttValue,
      deviceId?: string,
      controlId?: string
    ): void
  }

  /**
   * Соответствие типа контрола его типу значения.
   * @since 0.0.4
   *
   **/
  interface TypeMappings {
    /** A control that displays a value as text. */
    'text': string
    /** A control for a arbitrary value. */
    'value': number
    /** A control that toggles it's value when pressed by the user. */
    'switch': boolean
    /** A stateless push button. */
    'pushbutton': boolean
    /** A control for color in `'R;G;B'` format */
    'rgb': string
    /** A range slider that takes integer values between 0 and any other integer that is greater 1. */
    'range': number
    /** A control that indicates whether an alarm is active. */
    'alarm': boolean
  }

  type ControlType = Expand<keyof TypeMappings>

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

  type Title = string | TitleLocalized
  type TitleLocalized = Record<string, string>

  /**
   * Контрол устройства
   */
  interface Control {
    /**
     * Устанавливает заголовок.
     * @param title
     */
    setTitle(title: Title): void

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
    setType(type: ControlType): void

    setUnits(units: string): void

    setReadonly(isReadonly: boolean): void

    setMax(max: number): void

    setMin(min: number): void

    setPrecision(precision: number): void

    /**
     * Позволяет указать на наличие ошибки уровня контрола.
     * Применимо только к виртуальным устройствам.
     *
     * @param message Текст ошибки.
     *
     **/
    setError(message: string): void

    setOrder(order: number): void

    setValue(value: MqttValue | ControlValueOptions): void

    getId(): string

    /**
     * Возвращает заголовок контрола.
     * @param lang Язык заголовка, "en" по умолчанию.
     */
    getTitle(lang?: string): string

    getDescription(): string

    getType(): string

    getUnits(): string

    getReadonly(): boolean

    getMax(): number

    getMin(): number

    getPrecision(): number

    /**
     * Возвращает текст ошибки,
     * а при её отсутствии - пустую строку.
     *
     **/
    getError(): string

    getOrder(): number

    getValue(): string | number | boolean
  }

  /**
   * Базовые определения контрола.
   * @since 0.1.0
   *
   **/
  interface BaseControlType<TControl, TValue> {
    /** Тип контрола, публикуемый в MQTT-топике. */
    type: TControl
    /** Значение по умолчанию. */
    value?: TValue
  }

  /**
   * Расширяет тип Text дополнительными свойствами.
   * @since 0.1.0
   *
   **/
  interface __TextControlTypeExtension {

    /**
     * Задаёт подписи к значениям.
     *
     * Используется, когда количество значений
     * ограничено - например, при перечислении дней недели.
     *
     **/
    enum?: Record<string, Title>
  }

  /**
   * Расширяет тип Value дополнительными свойствами.
   * @since 0.1.0
   *
   **/
  interface __ValueControlTypeExtension {

    /**
     * Задаёт подписи к значениям.
     *
     * Используется, когда количество значений
     * ограничено - например, при перечислении дней недели.
     *
     **/
    enum?: Record<number, WbRules.Title>

    /** Задаёт минимально допустимое значение. */
    min?: number

    /** Задаёт максимально допустимое значение. */
    max?: number

    /** Определяет количество знаков после запятой. */
    precision?: number

    units?: string
  }

  /**
   * Расширяет тип Range дополнительными свойствами.
   * @since 0.1.0
   *
   **/
  interface __RangeControlTypeExtension {

    /** Задаёт минимально допустимое значение. */
    min?: number

    /** Задаёт максимально допустимое значение. */
    max?: number

    /** Определяет количество знаков после запятой. */
    precision?: number
  }

  /**
   * Добавляет расширенные свойства, соответственно типу контрола.
   * @since 0.1.0
   *
   **/
  type ControlTypeExtension<TControl>
    = TControl extends 'text'
      ? __TextControlTypeExtension
      : TControl extends 'value'
        ? __ValueControlTypeExtension
        : TControl extends 'range'
          ? __RangeControlTypeExtension
          : {}

  type __MappedControlTypes<
    K extends keyof TypeMappings = keyof TypeMappings
  >
    = K extends infer TControl
      ? BaseControlType<TControl, TypeMappings[K]> & ControlTypeExtension<TControl>
      : never

  /**
   * Параметры контрола.
   *
   **/
  type ControlOptions = Expand<__MappedControlTypes & {

    /**
     * Заголовок, публикуемый в MQTT-топике (meta/title)
     *
     **/
    title?: Title

    /**
     * Когда задано истинное значение, при запуске контроллера параметр всегда устанавливается в значение по умолчанию.
     * Иначе он будет установлен в последнее сохранённое значение.
     *
     **/
    forceDefault?: boolean

    /**
     * Когда задано истинное значение, параметр становится доступным только для чтения.
     *
     **/
    readonly?: boolean

    /**
     * Когда задано истинное значение, при описании контрола в коде фактическое создание его в MQTT происходить
     * не будет до тех пор, пока этому контролу не будет присвоено какое-либо значение.
     *
     * @example
     * ```ts
     * dev[deviceID][controlID] = "string"
     * ```
     **/
    lazyInit?: boolean

    /**
     * Порядок следования полей.
     *
     **/
    order?: number
  }>

  /**
   * Опции контрола типа `text`.
   *
   * @since 0.3.2
   *
   **/
  type TextControlOptions = Extract<ControlOptions, { type: 'text' }>

  /**
   * Опции контрола типа `value`.
   *
   * @since 0.3.2
   *
   **/
  type ValueControlOptions = Extract<ControlOptions, { type: 'value' }>

  /**
   * Опции контрола типа `range`.
   *
   * @since 0.3.2
   *
   **/
  type RangeControlOptions = Extract<ControlOptions, { type: 'range' }>

  /**
   * Опции контрола типа `switch`.
   *
   * @since 0.3.2
   *
   **/
  type SwitchControlOptions = Extract<ControlOptions, { type: 'switch' }>

  /**
   * Опции контрола типа `pushbutton`.
   *
   * @since 0.3.2
   *
   **/
  type PushButtonControlOptions = Extract<ControlOptions, { type: 'pushbutton' }>

  /**
   * Опции контрола типа `rgb`.
   *
   * @since 0.3.2
   *
   **/
  type RgbControlOptions = Extract<ControlOptions, { type: 'rgb' }>

  /**
   * Опции контрола типа `alarm`.
   *
   * @since 0.3.2
   *
   **/
  type AlarmControlOptions = Extract<ControlOptions, { type: 'alarm' }>

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

    /**
     * Позволяет указать на наличие ошибки уровня устройства.
     * Применимо только к виртуальным устройствам.
     *
     * @param message Текст ошибки.
     *
     **/
    setError(message: string): void

    /**
     * Возвращает текст ошибки,
     * а при её отсутствии - пустую строку.
     *
     **/
    getError(): string
  }

  type ControlOptionsTree = Record<string, ControlOptions>

  interface DeviceOptions {
    title: Title
    cells: ControlOptionsTree
  }

  /**
   * Функция, вызываемая при завершении процесса.
   * @param exitCode код возврата процесса
   * @param capturedOutput захваченный stdout процесса в виде строки в случае, когда задана опция {@link SpawnOptions.captureOutput}
   * @param capturedErrorOutput захваченный stderr процесса в виде строки в случае, когда задана опция {@link SpawnOptions.captureErrorOutput}
   *
   **/
  type ExitCallback = (
    exitCode: number,
    capturedOutput?: string,
    capturedErrorOutput?: string
  ) => void

  interface SpawnOptions {

    /**
     * Если true, захватить stdout процесса и передать его в виде строки в {@link exitCallback}
     *
     **/
    captureOutput?: boolean

    /**
     * Если true, захватить stderr процесса и передать его в виде строки в {@link exitCallback}.
     * Если данный параметр не задан, то stderr дочернего процесса направляется в stderr процесса wb-rules
     *
     **/
    captureErrorOutput?: boolean

    /**
     * Строка, которую следует использовать в качестве содержимого stdin процесса.
     *
     **/
    input?: string

    /**
     * Функция, вызываемая при завершении процесса.
     *
     **/
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
    /** Хранит данные, общие для всех экземпляров данного модуля. */
    static: WbRules.ModuleStatic
  }
}

/**
 * Путь к текущему сценарию wb-rules (точке входа), даже в модулях.
 * Пример строки: `/etc/wb-rules/my-script.js`
 *
 **/
declare var __filename: string

/** Используется для вывода сообщений в журнал контроллера и отладочную консоль. */
declare var log: WbRules.Log

/**
 * Используется для вывода отладочных сообщений в журнал контроллера и отладочную консоль.
 *
 * @since 0.3.2
 *
 **/
declare var debug: WbRules.Debug

/** Объект доступа к MQTT-топикам устройства. */
declare var dev: WbRules.Dev

/** Объект доступа к именованным таймера. */
declare var timers: WbRules.TimerCollection

/**
 * Используется для ввода спецификации cron-правила.
 *
 * Подробное описание формата выражений используемой cron-библиотеки:

 * https://pkg.go.dev/github.com/robfig/cron/v3#hdr-CRON_Expression_Format
 *
 * @example
 * ```ts
 * defineRule('cron_hourly', {
 *   when: cron('@hourly'),
 *   then: () => log('@hourly rule raised')
 * })
 * ```
 **/
declare function cron(spec: string): WbRules.CronEntry

/**
 * Создаёт правило обработки.
 * @param ruleName Название правила.
 * @param options Конфигурация правила.
 *
 **/
declare function defineRule(name: string, options: WbRules.RuleOptions): void

/**
 * Создаёт анонимное правило обработки.
 * @param options Конфигурация правила.
 *
 **/
declare function defineRule(options: WbRules.RuleOptions): void

/**
 * Создаёт виртуальное устройство.
 * @param deviceId Идентификатор устройства.
 * @param options Конфигурация устройства.
 *
 **/
declare function defineVirtualDevice(
  deviceId: string,
  options: WbRules.DeviceOptions
): WbRules.Device

/**
 * Позволяет получить объект для работы с указанным устройством.
 * @param deviceId Идентификатор устройства.
 *
 **/
declare function getDevice(deviceId: string): WbRules.Device | undefined

/**
 * Позволяет получить объект для работы с указанным контролом устройства.
 * @param controlPath Строка в формате "deviceId/controlId"
 *
 **/
declare function getControl(controlPath: string): WbRules.Control | undefined

/**
 * Запускает периодический таймер с указанным интервалом.
 * К таймеру можно обратиться через `timers.<name>` внутри when при работе с {@link defineRule}.
 *
 * @param name Идентификатор таймера в глобальном наборе {@link timers}.
 * @param delay Интервал срабатывания, в миллисекундах
 *
 **/
declare function startTicker(name: string, interval: number): void

/**
 * Запускает однократный таймер с указанным именем,
 * к которому можно обратиться через `timers.<name>`,
 *
 * см. [руководство по однократным таймерам](https://github.com/wirenboard/wb-rules?tab=readme-ov-file#однократные)
 *
 * @param name Идентификатор таймера в глобальном наборе {@link timers}.
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
 */
declare function startTimer(name: string, delay: number): void

/**
 * Запуск внешних процессов.
 * @param cmd
 * @param args
 * @param options
 *
 **/
declare function spawn(
  cmd: string,
  args: string[],
  options: WbRules.SpawnOptions | WbRules.ExitCallback
): void

declare function runShellCommand(
  command: string,
  options?: WbRules.SpawnOptions | WbRules.ExitCallback
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

interface String {
  /**
   * Осуществляет последовательную замену подстрок `{}` в указанной строке
   * на строковые представления своих аргументов и возвращает результирующую строку.
   * @param args
   */
  format(...args: (string | number | boolean)[]): string

  /**
   * Осуществляет последовательную замену подстрок `{}` в указанной строке
   * на строковые представления своих аргументов и возвращает результирующую строку.
   *
   * @warning В отличие от {@link format}, выполняет код внутри строки! Не использовать для обработки значений, вводимых пользователем.
   */
  xformat(...args: (string | number | boolean)[]): string
}

/**
 * Подписывает на прослушивание топика MQTT (допустимы символы # и +).
 * @param topic
 * @param callback
 */
declare function trackMqtt(
  topic: string,
  callback: (message: WbRules.MqttMessage) => void
): void

/**
 * Публикация сообщений в MQTT.
 *
 * Внимание! Не используйте `publish()` для изменения значения параметров устройств.
 * @param topic
 * @param payload
 * @param qos
 * @param retain
 */
declare function publish(
  topic: string,
  value: WbRules.MqttValue,
  qos?: number,
  retain?: boolean
): void

/**
 * Проксирует исходный объект, обеспечивая автоматическую синхронизацию
 * изменений в его свойствах со связанным хранилищем {@link PersistentStorage}.
 *
 * Важно: отслеживание изменений поддерживается только для возвращаемого функцией объекта.
 * Исходный объект не получит никакой дополнительной функциональности.
 *
 * @template TObject Тип исходного объекта. Обычно выводится автоматически (type inference), но при необходимости его можно задать явно.
 *
 * @param source Исходный объект, который будет проксирован.
 *
 * @example
 *
 * ```ts
 * // Оборачивание объекта в прокси.
 * const user = StorableObject({ id: 1, name: 'Alice' })
 *
 * // Подключение к энергонезависимому хранилищу.
 * const storage = new PersistentStorage('users', { global: true })
 * storage['user'] = user
 *
 * // Объект автоматически отслеживает изменения и передаёт их в хранилище.
 * user.name = 'Bob'
 *
 * ```
 * @example
 *
 * ```ts
 * interface User {
 *   id: number,
 *   name: string
 * }
 *
 * // Подключение к энергонезависимому хранилищу.
 * const storage = new PersistentStorage('users', { global: true })
 *
 * // Извлечение объекта.
 * const retrievedUser = storage['user'] as User
 *
 * // Изменения опять будут автоматически передаваться в хранилище.
 * retrievedUser.name = 'Charlie'
 *
 * ```
 */
declare function StorableObject<TObject>(source: TObject): TObject

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
