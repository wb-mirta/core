import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import { isString } from '@mirta/basics'
import type { ProjectSelection, ProjectType } from './types'

// Префиксы для определения типа
const MODULAR_PREFIX = /^(modular|mod)-/

export async function pickProjectAsync(
  templateInput: string | undefined
): Promise<ProjectSelection> {

  if (isString(templateInput)) {

    if (MODULAR_PREFIX.test(templateInput)) {

      return {
        type: 'modular',
        templateName: templateInput.replace(MODULAR_PREFIX, ''),
      }

    }

    // Всё остальное — классический тип проекта,
    // полное название шаблона.
    //
    return {
      type: 'classic',
      templateName: templateInput.replace(/^classic-/, ''),
    }

  }

  const { projectType } = await prompts({
    type: 'select',
    name: 'projectType',
    message: t('projectType.prompt'),
    hint: t('hint.select'),
    choices: [
      {
        title: t('projectType.classic'),
        value: 'classic',
      },
      {
        title: t('projectType.modular'),
        value: 'modular',
      },
    ],
  }) as { projectType: ProjectType }

  // Шаблон будет выбран позже.
  return { type: projectType }

}
