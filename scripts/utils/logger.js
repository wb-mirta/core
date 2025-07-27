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

const messages = {
  info: 'Info',
  success: 'Success',
  canceled: 'Canceled',
  warn: 'Warning',
  error: 'Error',
  note: 'Note',
}

/** @param {string|undefined} message */
const infoPill = message =>
  message ? bgCyan.black(` ${message} `) + (` ${cyan(dot)} `) : ''

/** @param {string|undefined} message */
const successPill = message =>
  message ? bgGreen.black(` ${message} `) + (` ${green(dot)} `) : ''

/** @param {string} message */
const errorPill = message =>
  message ? bgRed.white(` ${message} `) + (` ${red(dot)} `) : ''

/** @param {string} message */
const warnPill = message =>
  message ? bgYellow.black(` ${message} `) + (` ${yellow(dot)} `) : ''

/** @param {string|undefined} message */
export const formatMessage = message =>
  message ? `${greenBanner} ${message}` : ''

/**
 * @param {string} message
 * @param {string|undefined} title
 **/
export const formatSuccess = (message, title) =>
  message ? `${successPill(title)}${green(message)}` : ''

/**
 * @param {string} message
 * @param {string|undefined} title
 **/
export const formatError = (message, title) =>
  message ? `${errorPill(title)}${red(message)}` : ''

export function useLogger() {

  /** @param {string|undefined} message */
  function log(message) {

    if (message)
      console.log(`${greenBanner} ${message}`)

  }

  /** @param {string|undefined} message */
  function step(message) {

    if (message)
      console.log(`${dimmedBanner} ${dim(message)}`)

  }

  /** @param {string|undefined} message */
  function info(message, title = messages.info) {

    if (message)
      console.log(`${cyanBanner} ${infoPill(title)}${cyan(message)}`)

  }

  /** @param {string|undefined} message */
  function success(message, title = messages.success) {

    if (message)
      console.log(`${greenBanner} ${successPill(title)}${green(message)}`)

  }

  /** @param {string|undefined} message */
  function cancel(message, title = messages.canceled) {

    if (message)
      console.log(`${redBanner} ${errorPill(title)}${red(message)}`)

  }

  /** @param {string|undefined} message */
  function error(message, title = messages.error) {

    if (message)
      console.log(`${redBanner} ${errorPill(title)}${red(message)}`)

  }

  /** @param {string|undefined} message */
  function warn(message, title = messages.warn) {

    if (message)
      console.log(`${yellowBanner} ${warnPill(title)}${yellow(message)}`)

  }

  /** @param {string|undefined} message */
  function note(message, title = messages.note) {

    if (message)
      console.log(`${yellowBanner} ${warnPill(title)}${message}`)

  }

  return {
    log,
    info,
    step,
    success,
    cancel,
    error,
    warn,
    note,
  }

}
