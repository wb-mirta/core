import type { ProjectType } from '#project/types'
import { basename, dirname, resolve } from 'node:path'
import type { RawTemplate, Template, TemplateName } from './types'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { CreationError } from '#errors/create'

const templatesDir = resolve(
  fileURLToPath(
    new URL('../templates',
      import.meta.url
    )
  )
)

function assertConfigIsValid(value: unknown): asserts value is RawTemplate {

  if (typeof value !== 'object' || value === null)
    throw new Error('Template config must be an object')

}

export async function discoverTemplatesAsync(

  type: ProjectType

): Promise<ReadonlyMap<string, Template>> {

  const pathPattern = resolve(templatesDir, type, '*/template.json')

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

    const templateRoot = dirname(filePath)

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const name = (rawConfig.name || basename(templateRoot)) as TemplateName

    templates.set(name, {
      type: type,
      extends: rawConfig.extends,
      name: name,
      displayName: rawConfig.displayName ?? name,
      description: rawConfig.description ?? '',
      features: rawConfig.features,
      rootDir: templateRoot,
      order: rawConfig.order ?? 1000,
    })

  }

  return templates

}
