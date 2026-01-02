import { CLI_ORIGIN } from '#constants'
import { t } from '#i18n'
import type { ProjectContext } from '#project-context/types'
import { logger } from '#utils/logger'
import { extractFeatures, type ExtractedFeature } from './extractor'
import { selectFeaturesAsync } from './selector'

function overrideState(
  key: string,
  isEnabled: boolean,
  features: Record<string, ExtractedFeature | undefined>
) {

  const feature = features[key]

  if (!feature) {

    if (isEnabled)
      logger.warn(t('feature.skipped', { feature: key }))

    return false

  }

  if (isEnabled) {

    if (feature.state === 'blocked')
      throw new Error(`Feature ${key} blocked by ${feature.origin}`)

    feature.state = 'required'
    feature.origin = CLI_ORIGIN

  }
  else {

    if (feature.state === 'required')
      throw new Error(`Feature ${key} required by ${feature.origin}`)

    feature.state = 'blocked'
    feature.origin = CLI_ORIGIN

  }

  return true

}

export async function resolveFeaturesAsync(

  context: ProjectContext,
  overrides: Record<string, string | boolean | undefined> = {}

) {

  const features = extractFeatures(context.templates)

  for (const [key, value] of Object.entries(overrides)) {

    if (value === undefined)
      continue

    overrideState(key, !!value, features)

  }

  return await selectFeaturesAsync(features)

}
