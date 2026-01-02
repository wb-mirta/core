import fs from 'node:fs/promises'
import deepMerge from '#utils/deep-merge'
import { parseJson } from './parse-json'
import type { FilePath, JsonObject } from '#types'

export async function renderJsonAsync(
  source: FilePath | JsonObject,
  toPath: FilePath,
  resultHandler?: (result: JsonObject) => JsonObject
) {

  const targetObject
    = parseJson(await fs.readFile(toPath, 'utf-8'))

  const sourceObject = typeof source === 'string'
    ? parseJson(await fs.readFile(source, 'utf-8'))
    : source

  let mergedObject = deepMerge(
    targetObject,
    sourceObject
  ) as JsonObject

  if (resultHandler)
    mergedObject = resultHandler(mergedObject)

  await fs.writeFile(toPath, JSON.stringify(mergedObject, null, 2) + '\n')

}
