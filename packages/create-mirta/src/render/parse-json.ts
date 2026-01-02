import JSON5 from 'json5'
import type { JsonObject } from '#types'

export function parseJson(content: string) {

  // TODO: Добавить валидацию.

  return JSON5.parse<JsonObject>(content)

}
