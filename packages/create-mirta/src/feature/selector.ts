import type { Choice } from 'prompts'
import type { ExtractedFeature } from './extractor'
import { FEATURE_ORIGIN_CLI } from '#constants'
import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import chalk from 'chalk'

export async function selectFeaturesAsync(

  features: Record<string, ExtractedFeature>

): Promise<string[]> {

  const required: string[] = []

  const choices: Choice[] = []

  for (const [featureName, { state, origin }] of Object.entries(features)) {

    const isRequired = state === 'required'
    const isBlocked = state === 'blocked'
    const isRecommended = state === 'recommended'

    if (isRequired)
      required.push(featureName)

    if (isRequired || origin === FEATURE_ORIGIN_CLI)
      continue

    let hint = ''

    if (isRecommended)
      hint = ` (${t('hint.recommended').toLowerCase()})`

    choices.push({
      title: t.plain(`features.${featureName}.name`),
      description: t.plain(`features.${featureName}.description`) + hint,
      value: featureName,
      selected: isRecommended,
      disabled: isBlocked,
    })

  }

  const { selected } = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: t('features.select'),
    instructions: '\n' + chalk.dim(t('features.instructions')),
    warn: t('hint.blocked'),
    choices: choices,
  }) as { selected: string[] }

  return [
    ...required,
    ...selected,
  ]

}
