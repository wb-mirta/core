import { CreationError } from '#errors/create'
import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import type { Template } from './types'

export async function pickTargetAsync(

  templates: ReadonlyMap<string, Template>,
  templateName?: string

): Promise<Template> {

  if (templateName) {

    const template = templates.get(templateName)

    if (!template)
      throw new Error(`Unknown template ${templateName}`)

    return template

  }

  if (templates.size === 1)
    return templates.values().next().value as Template

  const { name } = await prompts({
    type: 'select',
    name: 'name',
    message: t('template.select'),
    hint: t('hint.select'),
    choices: [...templates.values()]
      .sort((a, b) => (a.order - b.order))
      .map(x => ({
        title: t.plain(`templates.${x.name}.name`, x.displayName),
        description: t.plain(`templates.${x.name}.description`, x.description),
        value: x.name,
      })),
  }) as Record<string, string>

  const template = templates.get(name)

  if (!template)
    throw CreationError.get('template.notFound', name)

  return template

}
