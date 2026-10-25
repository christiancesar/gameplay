import { describe, expect, it } from 'vitest'

import { screenAudioKey, toScreenGain } from './screen-audio'

describe('screen audio rules', () => {
  it('keeps the screen audio of someone apart from their voice', () => {
    expect(screenAudioKey('u2')).toBe('screen:u2')
    expect(screenAudioKey('u2')).not.toBe('u2')
  })

  it('turns the slider into a gain from 0 to 1', () => {
    expect(toScreenGain(0)).toBe(0)
    expect(toScreenGain(50)).toBe(0.5)
    expect(toScreenGain(100)).toBe(1)
    expect(toScreenGain(150)).toBe(1)
    expect(toScreenGain(-5)).toBe(0)
  })
})
