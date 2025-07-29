import * as p from '@clack/prompts'
import chalk from 'chalk'
import isUnicodeSupported from 'is-unicode-supported'
import { type Localized } from './localization'
import { formatError } from './logger'

export const unicode = isUnicodeSupported()
export const unicodeOr = (c: string, fallback: string) => (unicode ? c : fallback)
export const S_BAR = unicodeOr('│', '|')

export function usePrompts(messages: Localized) {

  function cancel(message: string = messages.errors.operationCanceled) {

    p.cancel(formatError(message, messages.status.canceled))

  }

  async function prompt<TResult>(
    cancellablePromise: Promise<TResult | symbol>
  ): Promise<TResult> {

    const result = await cancellablePromise

    if (p.isCancel(result)) {

      cancel()
      process.exit(1)

    }

    return result

  }

  function inlineSub(message: string) {

    return `\n${chalk.gray(S_BAR)}  ${message}`

  }

  return {
    cancel,
    prompt,
    step: p.log.step,
    message: p.log.message,
    inlineSub,
  }

}
