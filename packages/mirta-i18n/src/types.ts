/**
 * Тип для локали (например, 'en-US', 'ru-RU'), обеспечивающий типобезопасность.
 * Использует branded type для предотвращения случайного смешивания строк.
 *
 * @since 0.4.0
 *
 **/
export type Locale = Branded<string, 'Locale'>

/**
 * Тип для языкового кода (например, 'en', 'ru'), выделенного из локали.
 * Обеспечивает типобезопасность через branded type.
 *
 * @since 0.4.0
 *
 **/
export type Lang = Branded<string, 'Lang'>

/**
 * Допустимые типы значений переменных в сообщениях локализации.
 *
 * @since 0.4.0
 *
 * @private
 *
 **/
export type MessageVariable = string | number | null | undefined

/**
 * Базовый интерфейс для описания структуры сообщений и переменных локали.
 *
 * @since 0.4.0
 *
 **/
export interface GenericShape {

  /**
   * Словарь локализованных сообщений.
   * Ключ — идентификатор сообщения, значение — строка с текстом или шаблоном.
   *
   **/
  messages: Record<string, string | undefined>

  /**
   * Опциональные типы переменных для каждого сообщения.
   * Позволяет строго типизировать переменные при вызове `t(...)`.
   *
   **/
  variables: Record<string, Record<string, MessageVariable>>

}

/**
 * Ассет локализации — неизменяемый объект, содержащий данные для одной локали.
 *
 * @template TShape - Интерфейс локали, совместимый с `GenericShape`
 *
 * @property locale - Идентификатор локали (например, 'en-US')
 * @property lang - Языковой код (например, 'en'), извлечённый из локали
 * @property messages - Словарь локализованных сообщений для этой локали
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export interface LocaleAsset<TShape extends GenericShape> {

  readonly locale: Locale

  readonly lang: Lang

  readonly messages: TShape['messages']

}

/**
 * Извлекает тип переменных для указанного ключа сообщения.
 * Если переменные для ключа определены — возвращает соответствующий тип,
 * иначе — `never`.
 *
 * @template TShape - Интерфейс локали, совместимый с `GenericShape`
 * @template K - Ключ сообщения
 *
 * @since 0.4.0
 *
 * @private
 *
 **/
export type VariablesOf<TShape extends GenericShape, K extends keyof TShape['messages']>
  = K extends keyof TShape['variables']
    ? TShape['variables'][K]
    : never

/**
 * Интерфейс локализации, предоставляемый после инициализации.
 *
 * @since 0.4.0
 *
 **/
export interface Localization<TShape extends GenericShape> {

  /**
   * Возвращает текущую активную локаль.
   *
   **/
  getLocale: () => Locale

  /**
   * Асинхронно устанавливает новую локаль.
   * Если сообщения для указанной локали недоступны — используется fallback.
   *
   * @param locale - Локаль в виде строки (например, 'ru-RU')
   *
   **/
  setLocaleAsync: (locale: string) => Promise<void>

  /**
   * Переводит сообщение по ключу с подстановкой переменных.
   *
   * @template TMessageKey - Ключ сообщения
   * @param key - Ключ сообщения из `messages`
   * @param variables - Опциональные переменные для подстановки в сообщение
   * @returns Локализованная строка с подставленными значениями
   *
   **/
  t: <TMessageKey extends keyof TShape['messages']>(
    key: TMessageKey,
    variables?: VariablesOf<TShape, TMessageKey>
  ) => string

}

/**
 * Контекст выполнения локализации.
 * Содержит все необходимые данные для работы переводчика.
 *
 * @since 0.4.0
 *
 **/
export interface LocalizationContext<TShape extends GenericShape> {

  /**
   * Определяет реакцию на ошибки при локализации.
   *
   * - `true` — выбрасывает ошибки,
   * - `false` — использует fallback-поведение.
   *
   * По умолчанию `false`.
   *
   **/
  readonly strict: boolean

  /**
   * Рабочая директория, в которой ищутся файлы локализации.
   *
   **/
  readonly cwd: string

  /**
   * Набор данных fallback-локали.
   *
   **/
  readonly fallbackAsset: LocaleAsset<TShape>

  /**
   * Набор поддерживаемых локалей.
   */
  readonly supportedLocales: Set<Locale>

  /**
   * Текущая активная локаль.
   *
   **/
  locale: Locale

  /**
   * Текущий язык (например, 'ru', 'en'), выделенный из активной локали.
   * Используется для определения форм множественного числа.
   *
   **/
  lang: Lang

  /**
   * Текущие сообщения, соответствующие активной локали.
   *
   **/
  messages: TShape['messages']

}

/**
 * Формы множественного числа, поддерживаемые системой.
 * Используются в plural-выражениях.
 *
 * @since 0.4.0
 *
 * @internal
 *
 **/
export type PluralForm = 'one' | 'few' | 'many' | 'other'
