import type { Choice } from 'prompts'
import type { ExtractedFeature } from './extractor'
import { CLI_ORIGIN } from '#constants'
import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import chalk from 'chalk'

export async function selectFeaturesAsync(
  features: Record<string, ExtractedFeature>
) {

  const required: string[] = []

  const choices: Choice[] = []

  for (const [featureName, { state, origin }] of Object.entries(features)) {

    const isRequired = state === 'required'
    const isBlocked = state === 'blocked'
    const isRecommended = state === 'recommended'

    if (isRequired)
      required.push(featureName)

    if (origin === CLI_ORIGIN)
      continue

    let hint = ''

    if (isRecommended)
      hint = ` (${t('hint.recommended').toLowerCase()})`

    choices.push({
      title: t.plain(`features.${featureName}.name`),
      description: t.plain(`features.${featureName}.description`) + hint,
      value: featureName,
      selected: isRequired || isRecommended,
      disabled: isRequired || isBlocked,
    })

  }

  const { selected } = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: t('features.select'),
    instructions: '\n' + chalk.dim(t('features.instructions')),
    warn: t('hint.blocked'),
    choices: choices,
  })

  return [
    ...required,
    ...selected as string[],
  ]

}
