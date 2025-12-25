import type { StagedArgs, OptionSchema } from '#src/staged-args'
import { logger } from '#src/utils/logger'

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

  const { values, positionals } = args.parseFinal(options)

  if (values.dry) {

    logger.warn('Deprecated flag "--dry" used. Please use "--dry-run" instead')
    values['dry-run'] = values['dry-run'] !== false

  }

  return {

    values,
    positionals,

  }

}
