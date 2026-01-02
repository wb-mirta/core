import { CreationError } from '#errors/create'
import type { ProjectSelection } from '#project/types'
import { discoverTemplatesAsync } from './discover'
import { buildSequence } from './sequence.builder'
import { pickTargetAsync } from './target.picker'
import type { TemplateSequence } from './types'

export async function resolveTemplateSequenceAsync(

  selection: ProjectSelection

): Promise<TemplateSequence> {

  const { type, templateName } = selection

  const templates = await discoverTemplatesAsync(type)

  if (templates.size === 0)
    throw CreationError.get('load.noTemplates', type)

  const target = await pickTargetAsync(
    templates,
    templateName
  )

  return buildSequence(
    target,
    templates
  )

}
