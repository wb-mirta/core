import type { TrigramChunk } from './types'

/**
 * Строит множество триграмм для строки.
 * Добавляет __ в начало и __ в конец.
 *
 * Пример: 'abc' → ['__A', '_AB', 'ABC', 'BC_', 'C__']
 *
 * @param input - входная строка
 * @returns Record<TrigramChunk, boolean> — множество триграмм
 *
 * @since 0.4.0
 *
 **/
export function buildTrigrams(input: string): Record<TrigramChunk, boolean> {

  const padded = `__${input.toUpperCase()}__`

  const chunks: Record<TrigramChunk, boolean> = { }

  for (let i = 0; i < padded.length - 2; i++) {

    chunks[padded.slice(i, i + 3) as TrigramChunk] = true

  }

  return Object.freeze(chunks)

}
