import { describe, expect, it } from 'vitest'

import { audioSupportFor } from './audio-support'

describe('audioSupportFor', () => {
  it('tabs always, the whole screen on Windows, a single window never', () => {
    expect(audioSupportFor('tab')).toBe('supported')
    expect(audioSupportFor('screen')).toBe('windowsOnly')
    expect(audioSupportFor('window')).toBe('unsupported')
  })
})
