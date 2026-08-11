import { FeatureFlags } from 'uiSrc/constants'

import { initialState } from './features'

describe('app feature defaults', () => {
  it('keeps the Vector Visualizer development flag disabled by default', () => {
    expect(
      initialState.featureFlags.features[FeatureFlags.devVectorVisualizer],
    ).toEqual({ flag: false })
  })
})
