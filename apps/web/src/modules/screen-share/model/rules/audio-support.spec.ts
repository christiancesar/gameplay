import { describe, expect, it } from 'vitest'

import { audioSupportFor, isAudioUnlikely } from './audio-support'
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

  it('a window may have audio from Chromium 141', () => {
    expect(audioSupportFor('window', chrome('windows'))).toBe('windowMaybe')
    expect(audioSupportFor('window', chrome('windows', 140))).toBe('tabOnly')
  })

  it('Firefox and Safari capture no screen audio', () => {
    for (const source of ['screen', 'window', 'tab'] as const) {
      expect(audioSupportFor(source, firefox)).toBe('browserUnsupported')
    }
  })
})

describe('isAudioUnlikely', () => {
  it('warns only where audio most likely does not come', () => {
    expect(isAudioUnlikely('tabOnly')).toBe(true)
    expect(isAudioUnlikely('browserUnsupported')).toBe(true)
    expect(isAudioUnlikely('windowMaybe')).toBe(false)
    expect(isAudioUnlikely('supported')).toBe(false)
  })
})
