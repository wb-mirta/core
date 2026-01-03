import fs from 'node:fs/promises'
import { evaluate, patch } from 'golden-fleece'
import type { FilePath, JsonObject } from '#types'
import deepMerge from '#utils/deep-merge'

export function parse(content: string) {

  // TODO: Добавить валидацию.

  return evaluate(content) as JsonObject

}

export async function renderAsync(
  fromPath: FilePath,
  toPath: FilePath,
  content?: string,
  resultHandler?: (result: JsonObject) => JsonObject
) {

  const targetContent
    = await fs.readFile(toPath, 'utf-8')

  const targetObject
    = evaluate(targetContent) as JsonObject

  const sourceObject
    = content !== undefined
      ? evaluate(content) as JsonObject
      : evaluate(await fs.readFile(fromPath, 'utf-8')) as JsonObject

  let mergedObject = deepMerge(
    targetObject,
    sourceObject
  ) as JsonObject

  if (resultHandler)
    mergedObject = resultHandler(mergedObject)

  await fs.writeFile(toPath, patch(targetContent, mergedObject) + '\n')

}
