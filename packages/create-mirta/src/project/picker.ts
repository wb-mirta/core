import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import { isString } from '@mirta/basics'
import type { ProjectSelection, ProjectType } from './types'

// Префиксы для определения типа
const MONO_PREFIX = /^(mono)-/

export async function pickProjectAsync(
  templateInput: string | undefined
): Promise<ProjectSelection> {

  if (isString(templateInput)) {

    if (MONO_PREFIX.test(templateInput)) {

      return {
        type: 'mono',
        templateName: templateInput.replace(MONO_PREFIX, ''),
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
        title: t('projectType.mono'),
        value: 'mono',
      },
    ],
  }) as { projectType: ProjectType }

  // Шаблон будет выбран позже.
  return { type: projectType }

}
