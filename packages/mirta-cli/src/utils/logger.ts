import { t } from '../i18n'
import chalk from 'chalk'

const {
  dim,
  red,
  cyan,
  green,
  yellow,
  bgRed,
  bgCyan,
  bgGreen,
  bgYellow,
} = chalk

const dot = '•'
const banner = `Mirta ${dot}`
const redBanner = red(banner)
const cyanBanner = cyan(banner)
const greenBanner = green(banner)
const yellowBanner = yellow(banner)

const infoPill = (message?: string) =>
  message ? bgCyan.black(` ${message} `) + (` ${cyan(dot)} `) : ''

const successPill = (message?: string) => message
  ? bgGreen.black(` ${message} `) + ' '
  : ''

const warnPill = (message?: string) =>
  message ? bgYellow.black(` ${message} `) + (` ${yellow(dot)} `) : ''

const errorPill = (message?: string) => message
  ? bgRed.white(` ${message} `) + ' '
  : ''

export const formatMessage = (message: string) =>
  message ? `${greenBanner} ${message}` : ''

export const formatSuccess = (message: string, caption?: string) =>
  message ? `${successPill(caption)}${green(dot, message)}` : ''

export const formatError = (message: string, caption?: string) =>
  message ? `${errorPill(caption)}${red(dot, message)}` : ''

export function useLogger() {

  function log(message: string) {

    const formatted = formatMessage(message)

    if (formatted)
      console.log(formatted)

  }

  function step(message: string) {

    if (message)
      console.log(dim(message))

  }

  function info(message: string, caption = t('caption.info')) {

    if (message)
      console.log(`${cyanBanner} ${infoPill(caption)}${cyan(message)}`)

  }

  function note(message: string, caption = t('caption.note')) {

    if (message)
      console.log(`${yellowBanner} ${warnPill(caption)}${message}`)

  }

  function success(message: string, caption = t('caption.success')) {

    if (message)
      console.log(`${greenBanner} ${successPill(caption)}${green(dot, message)}`)

  }

  function warn(message: string, caption = t('caption.warning')) {

    if (message)
      console.log(`${yellowBanner} ${warnPill(caption)}${yellow(message)}`)

  }

  function error(message: string, caption = t('caption.error')) {

    if (message)
      console.log(`${redBanner} ${errorPill(caption)}${red(dot, message)}`)

  }

  function cancel(message: string, caption = t('caption.canceled')) {

    if (message)
      console.log(`${redBanner} ${errorPill(caption)}${red(dot, message)}`)

  }

  return {
    log,
    step,
    info,
    note,
    success,
    warn,
    error,
    cancel,
  }

}
