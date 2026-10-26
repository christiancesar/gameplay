import { describe, expect, it } from 'vitest'

import { toShareStartMeasurement } from './share-start.mapper'

describe('toShareStartMeasurement', () => {
  it('counts the audio asked and received, with source, surface, browser and system as labels', () => {
    const measurement = toShareStartMeasurement(
      { source: 'screen', surface: 'monitor', audioRequested: true, audioReceived: false },
      { engine: 'firefox', chromiumMajor: 0, os: 'windows', browser: 'Firefox' },
    )
    expect(measurement).toEqual({
      type: 'screen_share_start',
      values: { audio_requested: 1, audio_received: 0 },
      context: {
        source: 'screen',
        surface: 'monitor',
        browser: 'Firefox',
        engine: 'firefox',
        chromium_major: '0',
        os: 'windows',
      },
    })
  })
})
