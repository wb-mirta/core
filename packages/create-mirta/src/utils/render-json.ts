import fs from 'node:fs'
import deepMerge from './deep-merge'

export default function renderJson(
  source: string | object,
  targetFilePath: string,
  handle?: (result: object) => object
) {

  const existingData = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8')) as object

  const newData = typeof source === 'string'
    ? JSON.parse(fs.readFileSync(source, 'utf-8')) as object
    : source

  let mergedData = deepMerge(existingData, newData)

  if (handle)
    mergedData = handle(mergedData)

  fs.writeFileSync(targetFilePath, JSON.stringify(mergedData, null, 2) + '\n')

}
