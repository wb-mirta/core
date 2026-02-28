import chalk, { type ChalkInstance } from 'chalk';
import { t } from '#src/i18n';

/**
 * Базовые уровни логирования.
 *
 * @since 0.4.0
 *
 **/
type LogLevel = | 'info' | 'warn' | 'error' | 'debug';

/**
 * Расширенные уровни логирования, включая дополнительные статусы.
 *
 * @since 0.4.0
 *
 **/
type LogLevelExtended = LogLevel | 'success' | 'cancel' | 'step' | 'note';

/**
 * Символ-разделитель, используемый в префиксе логов.
 *
 * @since 0.3.0
 *
 **/
const dot = '•';

/**
 * Баннер, отображаемый в начале логов по умолчанию.
 *
 * @since 0.3.0
 *
 **/
const banner = `Mirta ${dot}`;

/**
 * Цвета текста для каждого уровня логирования.
 *
 * @since 0.4.0
 *
 **/
const colors: Record<LogLevelExtended, ChalkInstance> = {

  debug: chalk.magenta,
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,

  success: chalk.green,
  cancel: chalk.red,
  step: chalk.dim,
  note: chalk.yellowBright,

};

/**
 * Цвета фона для "pill" (подсветки метки уровня).
 *
 * @since 0.4.0
 *
 **/
const bgColors: Partial<Record<LogLevelExtended, ChalkInstance>> = {

  debug: chalk.bgMagenta.black,
  info: chalk.bgCyan.black,
  warn: chalk.bgYellow.black,
  error: chalk.bgRed.white,

  success: chalk.bgGreen.black,
  cancel: chalk.bgRed,

};

/**
 * Приоритет уровней логирования. Определяет, какие сообщения будут отображаться
 * при установленном уровне детализации.
 *
 * @since 0.4.0
 *
 **/
const levelPriority: LogLevelExtended[] = [
  'debug',
  'info',
  'warn',
  'error',
  'success',
  'cancel',
  'step',
  'note',
];

/**
 * Целевой уровень логирования. Сообщения с уровнем ниже указанного — игнорируются.
 *
 * @since 0.4.0
 *
 **/
let targetLevel = 1;

/**
 * Проверяет, должно ли сообщение быть залогировано, исходя из текущего уровня.
 *
 * @param level - Уровень логирования сообщения.
 * @returns {boolean} `true`, если сообщение удовлетворяет текущему уровню детализации.
 *
 * @since 0.4.0
 *
 **/
function shouldLog(level: LogLevelExtended): boolean {

  const currentLevel = levelPriority.indexOf(level);

  return currentLevel === -1 || currentLevel >= targetLevel;

}

/**
 * Создаёт функцию для формирования "pill" — цветной метки с названием уровня.
 *
 * @param level - Уровень логирования.
 * @returns Функция, возвращающая отформатированную метку.
 *
 * @since 0.4.0
 *
 **/
function createPill(level: LogLevelExtended) {

  const bgColor = bgColors[level] ?? ((text: string) => text);

  return (...text: (string | undefined)[]) => {

    const filteredText = text
      .filter(x => x !== undefined)
      .join(' ');

    if (filteredText.length === 0)
      return '';

    return bgColor(` ${filteredText} `) + ` ${dot} `;

  };

}

/**
 * Окрашиваемые области в сообщениях.
 *
 * @since 0.4.0
 *
 **/
type ColorScope = 'all' | 'first-line' | 'prefix' | 'none';

/**
 * Опции форматирования сообщения.
 *
 * @since 0.4.0
 *
 **/
interface FormattingOptions {

  /** Количество пробелов для отступа всего сообщения. */
  indent?: number;

  /** Включать ли префикс "Mirta • [метка]". По умолчанию `true`. */
  includePrefix?: boolean;

  /** Где применять цвет. По умолчанию `'first-line'`. */
  colorScope?: ColorScope;

  /** Переопределение цвета без смены уровня логирования. */
  colorOverride?: LogLevelExtended;

}

/**
 * Определяет, нужно ли применять цвет к строке сообщения.
 *
 * @param colorScope - Режим применения цвета.
 * @param lineIndex - Индекс строки (для многострочных сообщений).
 * @returns `true`, если цвет следует применить.
 *
 * @since 0.4.0
 *
 **/
function shouldColorLine(colorScope: ColorScope, lineIndex: number): boolean {

  if (colorScope === 'all')
    return true;

  if (colorScope === 'first-line')
    return lineIndex === 0;

  return false;

}

/**
 * Форматирует сообщение с учётом уровня, опций и цветов.
 *
 * @param level - Уровень логирования.
 * @param message - Сообщение для логирования. Может быть любого типа.
 * @param labelOrOptions - Метка (строка) или опции форматирования.
 * @param options - Опции форматирования (если первый параметр — метка).
 * @returns Отформатированная строка для вывода в консоль.
 *
 * @since 0.4.0
 *
 **/
function formatMessage(
  level: LogLevelExtended,
  message: unknown,
  labelOrOptions?: string | FormattingOptions,
  options?: FormattingOptions
): string {

  let label: string | undefined;
  let finalOptions: FormattingOptions;

  if (typeof labelOrOptions === 'string') {

    label = labelOrOptions;
    finalOptions = options ?? {};

  }
  else {

    finalOptions = labelOrOptions ?? {};

  }

  const {
    indent = 0,
    includePrefix = true,
    colorScope = 'first-line',
    colorOverride,
  } = finalOptions;

  const actualLevel = colorOverride ?? level;

  const color = colors[actualLevel];
  const pill = createPill(actualLevel);

  let text = '';

  if (Array.isArray(message)) {

    text = message.map(x => String(x)).join(' ');

  }
  else {

    text = String(message);

  }

  const lineIndent = ' '.repeat(indent);

  const lines = text.split('\n');

  let prefix = includePrefix ? `${banner} ${pill(label)}` : '';

  if (prefix && colorScope !== 'none')
    prefix = color(prefix);

  return lines
    .map((line, lineIndex) => {

      line = line.trim();

      if (shouldColorLine(colorScope, lineIndex))
        line = color(line);

      return lineIndex === 0
        ? lineIndent + prefix + line
        : lineIndent + `${' '.repeat(2)}${line}`;

    })
    .join('\n');

}

/**
 * Логирует сообщения с меткой и настройкой форматирования.
 *
 * @param level - Уровень логирования.
 * @param value - Сообщение.
 * @param label - Метка (например, "Info").
 * @param options - Дополнительные опции.
 *
 * @since 0.4.0
 *
 **/
function log(
  level: LogLevelExtended,
  value: unknown,
  label?: string,
  options?: FormattingOptions
): void;

/**
 * Логирует сообщения с настройкой форматирования.
 *
 * @param level - Уровень логирования.
 * @param value - Сообщение.
 * @param options - Дополнительные опции.
 *
 * @since 0.4.0
 *
 **/
function log(
  level: LogLevelExtended,
  value: unknown,
  options?: FormattingOptions
): void;

/**
 * Основная функция логирования. Проверяет уровень и выводит сообщение.
 *
 * @param level - Уровень логирования.
 * @param value - Сообщение.
 * @param labelOrOptions - Метка или опции.
 * @param options - Опции (если метка передана отдельно).
 *
 * @since 0.4.0
 *
 **/
function log(
  level: LogLevelExtended,
  value: unknown,
  labelOrOptions?: string | FormattingOptions,
  options?: FormattingOptions
): void {

  if (!shouldLog(level))
    return;

  console.log(
    formatMessage(level, value, labelOrOptions, options)
  );

}

/**
 * Опции для метода `step`.
 */
interface StepOptions {
  /**
   * Количество пробелов для отступа вложенности.
   * @default 0
   */
  indent?: number;
}

/**
 * Опции для метода `note`.
 */
interface NoteOptions {
  /**
   * Количество пробелов для отступа.
   * @default 0
   */
  indent?: number;

  /**
   * Включать ли префикс "Mirta • [note]".
   * @default true
   */
  includePrefix?: boolean;
}

/**
 * Публичный интерфейс логгера. Предоставляет методы для логирования на разных уровнях.
 *
 * @example
 * ```ts
 * logger.info('Команда запущена')
 * logger.warn('Устаревший режим', 'DEPRECATED')
 * logger.step('Сборка...', { indent: 2 })
 * ```
 *
 * @since 0.4.0
 *
 **/
export const logger = {

  /**
   * Устанавливает минимальный уровень логирования.
   *
   * @param level - Уровень, начиная с которого выводятся сообщения.
   *
   **/
  setLevel: (level: LogLevel) => {

    targetLevel = levelPriority.indexOf(level);

  },

  /**
   * Логирует нейтральное сообщение с визуальным оформлением успеха.
   * Использует уровень `info`, но цвет `success` (только в префиксе).
   *
   **/
  log: (value: unknown) => {

    log('info', value, {
      colorScope: 'prefix',
      colorOverride: 'success',
    });

  },

  /**
   * Логирует отладочное сообщение.
   *
   * @param value - Сообщение.
   * @param label - Настраиваемая метка.
   *
   **/
  debug: (value: unknown, label = t('label.debug')) => {

    log('debug', value, label);

  },

  /**
   * Логирует информационное сообщение.
   *
   * @param value - Сообщение.
   * @param label - Настраиваемая метка.
   *
   **/
  info: (value: unknown, label = t('label.info')) => {

    log('info', value, label);

  },

  /**
   * Логирует предупреждение.
   *
   * @param value - Сообщение.
   * @param label - Настраиваемая метка.
   *
   **/
  warn: (value: unknown, label = t('label.warning')) => {

    log('warn', value, label);

  },

  /**
   * Логирует ошибку.
   *
   * @param value - Сообщение.
   * @param label - Настраиваемая метка.
   *
   **/
  error: (value: unknown, label = t('label.error')) => {

    log('error', value, label);

  },

  /**
   * Логирует сообщение об успешном завершении.
   *
   * @param value - Сообщение.
   * @param label - Настраиваемая метка.
   *
   **/
  success: (value: unknown, label = t('label.success')) => {

    log('success', value, label);

  },

  /**
   * Логирует сообщение об отмене действия.
   *
   * @param value - Сообщение.
   * @param label - Настраиваемая метка.
   *
   **/
  cancel: (value: unknown, label = t('label.canceled')) => {

    log('cancel', value, label);

  },

  /**
   * Логирует шаг процесса. Без префикса, цветной текст, с отступом.
   *
   * @param value - Сообщение.
   * @param options - Настройка отступа.
   *
   **/
  step: (value: unknown, options: StepOptions = { indent: 0 }) => {

    log('step', value, {
      includePrefix: false,
      colorScope: 'all',
      indent: options.indent,
    });

  },

  /**
   * Логирует вспомогательную заметку. Цвет применяется только к префиксу.
   *
   * @param value - Сообщение.
   * @param options - Опции форматирования.
   *
   **/
  note: (value: unknown, options: NoteOptions = { indent: 0, includePrefix: true }) => {

    log('note', value, {
      includePrefix: options.includePrefix,
      colorScope: 'prefix',
      indent: options.indent,
    });

  },

} as const;
