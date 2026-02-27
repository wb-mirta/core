/**
 * Модуль для поэтапного разбора аргументов командной строки
 * с поддержкой типизации, валидации и подсказок.
 *
 * Позволяет обрабатывать опции, позиционные аргументы и терминатор `--`,
 * с возможностью многоэтапного парсинга.
 *
 * @packageDescription
 *
 **/

export { createStagedArgs } from './args';

export type {
  StagedArgs,
  ParsedArgs,
  ParsedArgsFinal,
  Values,
  OptionSchema,
  SuggestFunc,
  ParseError
} from './types';

export type { Result } from './result';

export { SchemaError } from './errors/schema';
