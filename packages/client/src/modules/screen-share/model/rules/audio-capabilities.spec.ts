import { describe, expect, it } from 'vitest'

import { audioCapabilitiesOf } from './audio-capabilities'

const CHROME_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const FIREFOX_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0'

describe('audioCapabilitiesOf', () => {
  it('shares the audio of the whole system on Chromium for Windows, and never of a single window', () => {
    expect(audioCapabilitiesOf({ userAgent: CHROME_WINDOWS })).toEqual({ windowAudio: false, systemAudio: true })
  })

  it('shares no screen audio on Linux, where only a tab has it', () => {
    expect(audioCapabilitiesOf({ userAgent: CHROME_LINUX })).toEqual({ windowAudio: false, systemAudio: false })
  })

  it('shares none outside Chromium', () => {
    expect(audioCapabilitiesOf({ userAgent: FIREFOX_WINDOWS })).toEqual({ windowAudio: false, systemAudio: false })
  })
})
