import { type Localized } from './localization'
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
const dimmedBanner = dim(banner)

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

export const formatSuccess = (message: string, title?: string) =>
  message ? `${successPill(title)}${green(dot, message)}` : ''

export const formatError = (message: string, title?: string) =>
  message ? `${errorPill(title)}${red(dot, message)}` : ''

export function useLogger(localized: Localized) {

  function log(message: string) {

    const formatted = formatMessage(message)

    if (formatted)
      console.log(formatted)

  }

  function step(message: string) {

    if (message)
      console.log(`${dimmedBanner} ${dim(message)}`)

  }

  function info(message: string, title = localized.status.info) {

    if (message)
      console.log(`${cyanBanner} ${infoPill(title)}${cyan(message)}`)

  }

  function note(message: string, title = localized.status.note) {

    if (message)
      console.log(`${yellowBanner} ${warnPill(title)}${message}`)

  }

  function success(message: string, title = localized.status.success) {

    if (message)
      console.log(`${greenBanner} ${successPill(title)}${green(dot, message)}`)

  }

  function warn(message: string, title = localized.status.warn) {

    if (message)
      console.log(`${yellowBanner} ${warnPill(title)}${yellow(message)}`)

  }

  function error(message: string, title = localized.status.error) {

    if (message)
      console.log(`${redBanner} ${errorPill(title)}${red(dot, message)}`)

  }

  function cancel(message: string, title = localized.status.canceled) {

    if (message)
      console.log(`${redBanner} ${errorPill(title)}${red(dot, message)}`)

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
