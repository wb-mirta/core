import type { ParseError, Result } from '@mirta/staged-args'
import { t } from '#i18n'
import chalk from 'chalk'

export function assertNoParseErrors<TData>(
  result: Result<TData, ParseError>
): asserts result is { hasErrors: false, data: TData } {

  if (!result.hasErrors)
    return

  const lines: string[] = [
    t('args.errorHeader', { count: result.errors.length }),
  ]

  for (const error of result.errors) {

    switch (error.type) {

      case 'unknown-option':

        if (error.suggestion) {

          lines.push(
            t('args.unknownOptionSuggest', {
              option: chalk.bold(error.option),
              suggestion: chalk.bold(`--${error.suggestion}`),
            })
          )

        }
        else {

          lines.push(
            t('args.unknownOption', {
              option: chalk.bold(error.option),
            })
          )

        }

        break

      case 'missing-value':

        lines.push(
          t('args.missingValue', {
            option: chalk.bold(error.option),
          })
        )

        break

    }

  }

  throw new Error(lines.join('\n'))

}
