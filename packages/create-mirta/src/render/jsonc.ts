import fs from 'node:fs/promises'
import type { FilePath, JsonObject } from '#types'
import deepMerge from '#utils/deep-merge'
import * as jsonc from '#jsonc'

export async function renderAsync(
  fromPath: FilePath,
  toPath: FilePath,
  content?: string
): Promise<void> {

  const targetContent
    = await fs.readFile(toPath, 'utf-8')

  const targetObject
    = jsonc.parseJsonc(targetContent) as JsonObject

  const sourceObject
    = content !== undefined
      ? jsonc.parseJsonc(content)
      : jsonc.parseJsonc(await fs.readFile(fromPath, 'utf-8'))

  const mergedObject = deepMerge(
    targetObject,
    sourceObject
  ) as jsonc.JsoncContainer

  await fs.writeFile(toPath, jsonc.stringify(mergedObject) + '\n')

}
