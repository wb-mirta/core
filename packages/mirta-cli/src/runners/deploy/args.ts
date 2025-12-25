import type { StagedArgs, OptionSchema } from '@mirta/staged-args'
import { logger } from '#utils/logger'
import { assertNoParseErrors } from '#utils/assertions'

/**
 * Схема доступных опций команды `deploy`.
 *
 * Определяет типы и сокращённые формы флагов.
 *
 * @since 0.4.0
 *
 **/
const options = ({
  'config': {
    type: 'string',
    short: 'c',
  },
  'dry-run': {
    type: 'boolean',
  },
  'profile': {
    type: 'string',
    short: 'p',
  },
  'to': {
    type: 'string',
  },
  // Deprecated. Use 'dry-run' instead
  'dry': {
    type: 'boolean',
  },
}) satisfies OptionSchema

/**
 * Парсит аргументы командной строки для команды `deploy`.
 *
 * - Обрабатывает опции в соответствии с объявленной схемой.
 * - Если используется устаревший флаг `--dry`, выводит предупреждение и преобразует его в `--dry-run`.
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

  if (values.dry) {

    logger.warn('Deprecated flag "--dry" used. Please use "--dry-run" instead')
    values['dry-run'] = values['dry-run'] !== false

  }

  return {

    values,
    positionals,

  }

}
