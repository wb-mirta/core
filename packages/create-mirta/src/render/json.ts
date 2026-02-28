import fs from 'node:fs/promises';
import type { FilePath, JsonObject } from '#types';
import deepMerge from '#utils/deep-merge';

export function parse(content: string) {

  // TODO: Добавить валидацию.

  return JSON.parse(content) as JsonObject;

}

export async function renderAsync(
  fromPath: FilePath,
  toPath: FilePath,
  content?: string,
  resultHandler?: (result: JsonObject) => JsonObject
) {

  const targetContent
    = await fs.readFile(toPath, 'utf-8');

  const targetObject
    = parse(targetContent);

  const sourceObject
    = content !== undefined
      ? parse(content)
      : parse(await fs.readFile(fromPath, 'utf-8'));

  let mergedObject = deepMerge(
    targetObject,
    sourceObject
  ) as JsonObject;

  if (resultHandler)
    mergedObject = resultHandler(mergedObject);

  await fs.writeFile(toPath, JSON.stringify(mergedObject, null, 2) + '\n');

}
