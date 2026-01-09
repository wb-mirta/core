import type { ProjectType } from '#project/types'
import { basename, dirname, resolve } from 'node:path'
import type { RawTemplate, Template, TemplateName } from './types'
import fs from 'node:fs/promises'
import { CreationError } from '#errors/create'

const templatesDir = resolve(import.meta.dirname, '../templates')

function assertConfigIsValid(value: unknown): asserts value is RawTemplate {

  if (typeof value !== 'object' || value === null)
    throw new Error('Template config must be an object')

}

export async function discoverTemplatesAsync(

  type: ProjectType

): Promise<ReadonlyMap<string, Template>> {

  const pathPattern = resolve(templatesDir, `{shared,${type}}/*/template.json`)

  const templates = new Map<string, Template>()

  for await (const filePath of fs.glob(pathPattern)) {

    let rawConfig: unknown

    try {

      rawConfig = JSON.parse(
        await fs.readFile(filePath, 'utf-8')
      )

    }
    catch {

      throw CreationError.get(
        'template.invalidConfig',
        basename(dirname(filePath))
      )

    }

    assertConfigIsValid(rawConfig)

    const rootDir = dirname(filePath)
    const name = (rawConfig.name || basename(rootDir)) as TemplateName

    if (templates.has(name))
      throw CreationError.get('template.duplicateName', name)

    templates.set(name, {
      ...rawConfig,
      type: type,
      name: name,
      rootDir: rootDir,
      displayName: rawConfig.displayName ?? name,
      description: rawConfig.description ?? '',
      order: rawConfig.order ?? Number.POSITIVE_INFINITY,
    })

  }

  return templates

}
