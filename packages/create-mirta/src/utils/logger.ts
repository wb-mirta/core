import { type Localized } from './localization'
import chalk from 'chalk'

const {
  red,
  green,
  bgRed,
  bgGreen,
} = chalk

const dot = '•'
const banner = `Mirta ${dot}`
const greenBanner = green(banner)
const redBanner = red(banner)

const successPill = (message?: string) => message
  ? bgGreen.black(` ${message} `) + ' '
  : ''

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

  function success(message: string, title = localized.status.success) {

    if (message)
      console.log(`${greenBanner} ${successPill(title)} ${green(dot, message)}`)

  }

  function error(message: string, title = localized.status.error) {

    if (message)
      console.log(`${redBanner} ${errorPill(title)} ${red(dot, message)}`)

  }

  function cancel(message: string, title = localized.status.canceled) {

    if (message)
      console.log(`${redBanner} ${errorPill(title)} ${red(dot, message)}`)

  }

  return {
    log,
    success,
    error,
    cancel,
  }

}
