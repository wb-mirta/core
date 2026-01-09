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
      throw CreationError.get('template.notFound', templateName)

    return template

  }

  if (templates.size === 1)
    return templates.values().next().value as Template

  const response = await prompts({
    type: 'select',
    name: 'templateName',
    message: t('template.select'),
    hint: t('hint.select'),
    choices: [...templates.values()]
      .filter(x => !x.hidden)
      .sort((a, b) => (a.order - b.order))
      .map(x => ({
        title: t.plain(`templates.${x.name}.name`, x.displayName),
        description: t.plain(`templates.${x.name}.description`, x.description),
        value: x.name,
      })),
  }) as Record<string, string>

  const template = templates.get(response.templateName)

  if (!template)
    throw CreationError.get('template.notFound', response.templateName)

  return template

}
