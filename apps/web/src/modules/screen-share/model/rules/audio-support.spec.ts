import { describe, expect, it } from 'vitest'

import { audioSupportFor, canShareAudio } from './audio-support'
import type { CapturePlatform } from './capture-platform'

const chrome = (os: CapturePlatform['os'], chromiumMajor = 141): CapturePlatform => ({
  engine: 'chromium',
  chromiumMajor,
  os,
  browser: 'Chrome',
})
const firefox: CapturePlatform = { engine: 'firefox', chromiumMajor: 0, os: 'windows', browser: 'Firefox' }

describe('audioSupportFor', () => {
  it('a tab has audio in any Chromium', () => {
    expect(audioSupportFor('tab', chrome('linux', 120))).toBe('supported')
  })

  it('the whole screen on Windows and ChromeOS, on macOS from Chromium 141, never on Linux', () => {
    expect(audioSupportFor('screen', chrome('windows', 120))).toBe('supported')
    expect(audioSupportFor('screen', chrome('chromeos'))).toBe('supported')
    expect(audioSupportFor('screen', chrome('mac'))).toBe('recentMac')
    expect(audioSupportFor('screen', chrome('mac', 140))).toBe('tabOnly')
    expect(audioSupportFor('screen', chrome('linux'))).toBe('tabOnly')
  })

  it('never the audio of a single window', () => {
    expect(audioSupportFor('window', chrome('windows'))).toBe('windowUnsupported')
    expect(audioSupportFor('window', chrome('linux'))).toBe('windowUnsupported')
  })

  it('Firefox and Safari capture no screen audio', () => {
    for (const source of ['screen', 'window', 'tab'] as const) {
      expect(audioSupportFor(source, firefox)).toBe('browserUnsupported')
    }
  })
})

describe('canShareAudio', () => {
  it('only where the browser gives screen audio', () => {
    expect(canShareAudio('supported')).toBe(true)
    expect(canShareAudio('recentMac')).toBe(true)
    expect(canShareAudio('windowUnsupported')).toBe(false)
    expect(canShareAudio('tabOnly')).toBe(false)
    expect(canShareAudio('browserUnsupported')).toBe(false)
  })
})
