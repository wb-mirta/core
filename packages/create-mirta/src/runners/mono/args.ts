import type { StagedArgs } from '@mirta/staged-args'
import { assertNoParseErrors } from '#assertions'

// Опции режима сборки mono
const options = {

  eslint: {
    type: 'boolean',
  },
  vitest: {
    type: 'boolean',
  },
  ssh: {
    type: 'string',
  },
  rutoken: {
    type: 'boolean',
  },

} as const

/**
 * Парсит аргументы командной строки для сборки в режиме `mono`.
 *
 * @param args - Объект с аргументами, управляемый `StagedArgs`.
 * @returns Объект с распарсенными значениями и позиционными аргументами.
 *
 * @since 0.4.0
 *
 **/
export function parseArgs(
  args: StagedArgs
) {

  const parseResult = args.parseFinal(options)
  assertNoParseErrors(parseResult)

  const { values, positionals } = parseResult.data

  return {

    values,
    positionals,

  }

}
