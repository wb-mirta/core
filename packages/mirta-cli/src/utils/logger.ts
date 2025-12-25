import chalk, { type ChalkInstance } from 'chalk'
import { t } from '#src/i18n'

type LogLevel = | 'info' | 'warn' | 'error' | 'debug'

type LogLevelExtended = LogLevel | 'success' | 'cancel' | 'step' | 'note'

const dot = '•'
const banner = `Mirta ${dot}`

const colors: Record<string, ChalkInstance> = {

  debug: chalk.magenta,
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,

  success: chalk.green,
  cancel: chalk.red,
  step: chalk.dim,
  note: chalk.yellowBright,

}

const bgColors: Record<string, ChalkInstance> = {

  debug: chalk.bgMagenta.black,
  info: chalk.bgCyan.black,
  warn: chalk.bgYellow.black,
  error: chalk.bgRed.white,

  success: chalk.bgGreen.black,
  cancel: chalk.bgRed,

}

const levelPriority: LogLevelExtended[] = [
  'debug',
  'info',
  'warn',
  'error',
  'success',
  'cancel',
  'step',
  'note',
]

let targetLevel = 0

function shouldLog(level: LogLevelExtended): boolean {

  const currentLevel = levelPriority.indexOf(level)

  return currentLevel === -1 || currentLevel >= targetLevel

}

function createPill(level: LogLevelExtended) {

  const bgColor = bgColors[level] ?? ((text: string) => text)

  return (...text: (string | undefined)[]) => {

    const filteredText = text
      .filter(x => x !== undefined)
      .join(' ')

    if (filteredText.length === 0)
      return ''

    return bgColor(` ${filteredText} `) + ` ${dot} `

  }

}

type ColorScope = 'all' | 'first-line' | 'prefix' | 'none'

interface FormattingOptions {

  indent?: number
  includePrefix?: boolean
  colorScope?: ColorScope
  colorOverride?: LogLevelExtended

}

function shouldColorLine(colorScope: ColorScope, lineIndex: number): boolean {

  if (colorScope === 'all')
    return true

  if (colorScope === 'first-line')
    return lineIndex === 0

  return false

}

function formatMessage(
  level: LogLevelExtended,
  message: unknown,
  labelOrOptions?: string | FormattingOptions,
  options?: FormattingOptions
): string {

  let label: string | undefined
  let finalOptions: FormattingOptions

  if (typeof labelOrOptions === 'string') {

    label = labelOrOptions
    finalOptions = options ?? {}

  }
  else {

    finalOptions = labelOrOptions ?? {}

  }

  const {
    indent = 0,
    includePrefix = true,
    colorScope = 'first-line',
    colorOverride,
  } = finalOptions

  const actualLevel = colorOverride ?? level

  const color = colors[actualLevel] ?? ((...text: unknown[]) => text.join(' '))
  const pill = createPill(actualLevel)

  let text = ''

  if (Array.isArray(message)) {

    text = message.map(x => String(x)).join(' ')

  }
  else {

    text = String(message)

  }

  const lineIndent = ' '.repeat(indent)

  const lines = text.split('\n')

  let prefix = includePrefix ? `${banner} ${pill(label)}` : ''

  if (prefix && colorScope !== 'none')
    prefix = color(prefix)

  return lines
    .map((line, lineIndex) => {

      line = line.trim()

      if (shouldColorLine(colorScope, lineIndex))
        line = color(line)

      return lineIndex === 0
        ? lineIndent + prefix + line
        : lineIndent + `${' '.repeat(2)}${line}`

    })
    .join('\n')

}

function log(
  level: LogLevelExtended,
  value: unknown,
  label?: string,
  options?: FormattingOptions
): void

function log(
  level: LogLevelExtended,
  value: unknown,
  options?: FormattingOptions
): void

function log(
  level: LogLevelExtended,
  value: unknown,
  labelOrOptions?: string | FormattingOptions,
  options?: FormattingOptions
): void {

  if (!shouldLog(level))
    return

  console.log(
    formatMessage(level, value, labelOrOptions, options)
  )

}

export const logger = {

  setLevel: (level: LogLevel) => {

    targetLevel = levelPriority.indexOf(level)

  },

  log: (value: unknown) => {

    log('info', value, {
      colorScope: 'prefix',
      colorOverride: 'success',
    })

  },

  debug: (value: unknown, label = t('label.debug')) => {

    log('debug', value, label)

  },

  info: (value: unknown, label = t('label.info')) => {

    log('info', value, label)

  },

  warn: (value: unknown, label = t('label.warning')) => {

    log('warn', value, label)

  },

  error: (value: unknown, label = t('label.error')) => {

    log('error', value, label)

  },

  success: (value: unknown, label = t('label.success')) => {

    log('success', value, label)

  },

  cancel: (value: unknown, label = t('label.canceled')) => {

    log('cancel', value, label)

  },

  step: (value: unknown, options = { indent: 2 }) => {

    log('step', value, {
      includePrefix: false,
      colorScope: 'all',
      indent: options.indent,
    })

  },

  note: (value: unknown, options = { indent: 0, includePrefix: true }) => {

    log('note', value, {
      includePrefix: options.includePrefix,
      colorScope: 'prefix',
      indent: options.indent,
    })

  },

} as const
