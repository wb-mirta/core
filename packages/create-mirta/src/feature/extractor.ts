import type { TemplateSequence, TemplateName } from '#template/types'
import type { FeatureState } from './types'

export interface ExtractedFeature {

  state: FeatureState

  origin: 'cli' | TemplateName

}

const featurePriority = {

  'optional': 0,
  'recommended': 1,
  'required': 2,
  'blocked': 3,

} satisfies Record<FeatureState, number>

export function assertIsFeatureEntry(entry: unknown[]): asserts entry is [string, FeatureState] {

  const [feature, state] = entry

  if (typeof feature !== 'string')
    throw new Error(
      `Invalid feature name: expected string, got ${typeof feature}`
    )

  if (typeof state !== 'string')
    throw new Error(
      `Invalid feature state: expected string, got ${typeof state}`
    )

  if ((!(state in featurePriority)))
    throw new Error(
      `Unknown feature state "${state}", supported values: ${Object.keys(featurePriority).join(', ')}`
    )

}

export function extractFeatures(

  sequence: TemplateSequence

): Record<string, ExtractedFeature> {

  const result: Record<string, ExtractedFeature> = {}

  for (const template of sequence) {

    if (!template.features?.global)
      continue

    for (const entry of Object.entries(template.features.global)) {

      assertIsFeatureEntry(entry)

      const [featureName, state] = entry

      if (!(featureName in result)) {

        result[featureName] = { state, origin: template.name }

        continue

      }

      const { state: oldState, origin } = result[featureName]

      if (state === 'required' && oldState === 'blocked')
        throw new Error(`Unable to require feature "${featureName}": blocked by "${origin}"`)

      if (state === 'blocked' && oldState === 'required')
        throw new Error(`Unable to block feature "${featureName}": required by "${origin}"`)

      if (featurePriority[state] > featurePriority[oldState]) {

        result[featureName] = { state, origin: template.name }

      }

    }

  }

  return result

}
