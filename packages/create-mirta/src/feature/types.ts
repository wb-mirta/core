import type { TemplateName } from '#template/types'

export type FeatureName = Branded<string, 'FeatureName'>

export type FeatureState = 'blocked' | 'required' | 'recommended' | 'optional'

export interface ResolvedFeature {

  state: FeatureState

  origin: 'cli' | TemplateName

}
