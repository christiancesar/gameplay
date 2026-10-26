import { describe, expect, it } from 'vitest'

import { STREAM_PRESETS } from '@gameplay/contracts'

import {
  contentHintOf,
  displayMediaOptions,
  fromPreset,
  liveVideoConstraints,
  presetSpec,
  toPreset,
  videoEncoding,
} from './preset'

describe('preset rules', () => {
  it('makes the four presets of the API from resolution and frame rate, and back', () => {
    const presets = [toPreset('720p', 30), toPreset('720p', 60), toPreset('1080p', 30), toPreset('1080p', 60)]
    expect(presets).toEqual([...STREAM_PRESETS])
    for (const preset of STREAM_PRESETS)
      expect(toPreset(fromPreset(preset).resolution, fromPreset(preset).fps)).toBe(preset)
  })

  it('knows size, rate and bitrate ceiling of each preset', () => {
    expect(presetSpec('720p30')).toEqual({ width: 1280, height: 720, fps: 30, maxBitrate: 2_500_000 })
    expect(presetSpec('1080p60')).toEqual({ width: 1920, height: 1080, fps: 60, maxBitrate: 8_000_000 })
    expect(presetSpec('1080p60').maxBitrate).toBeGreaterThan(presetSpec('1080p30').maxBitrate)
    expect(presetSpec('1080p30').maxBitrate).toBeGreaterThan(presetSpec('720p30').maxBitrate)
  })

  it('asks the picker for the surface, size and rate, with the surface as a hint', () => {
    const options = displayMediaOptions({ source: 'tab', resolution: '720p', fps: 60, includeAudio: false })
    expect(options.video).toEqual({
      displaySurface: 'browser',
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 60 },
    })
    expect(options.audio).toBe(false)
    expect(
      displayMediaOptions({ source: 'screen', resolution: '720p', fps: 60, includeAudio: false }).video,
    ).toMatchObject({
      displaySurface: 'monitor',
    })
    expect(
      displayMediaOptions({ source: 'window', resolution: '720p', fps: 60, includeAudio: false }).video,
    ).toMatchObject({
      displaySurface: 'window',
    })
  })

  it('keeps the voice filters off the game audio', () => {
    const options = displayMediaOptions({ source: 'tab', resolution: '1080p', fps: 30, includeAudio: true })
    expect(options.audio).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: false })
  })

  it('offers system audio for a screen and the window audio for a window only when audio is asked', () => {
    const withAudio = displayMediaOptions({ source: 'window', resolution: '1080p', fps: 60, includeAudio: true })
    expect(withAudio).toMatchObject({ systemAudio: 'include', windowAudio: 'window' })
    const without = displayMediaOptions({ source: 'window', resolution: '1080p', fps: 60, includeAudio: false })
    expect(without).toMatchObject({ systemAudio: 'exclude', windowAudio: 'exclude' })
  })

  it('smooth keeps the frame rate and uses the motion hint; sharp keeps the resolution and uses detail', () => {
    expect(contentHintOf('smooth')).toBe('motion')
    expect(contentHintOf('sharp')).toBe('detail')
    expect(videoEncoding('1080p60', 'smooth')).toEqual({
      maxBitrate: 8_000_000,
      maxFramerate: 60,
      degradationPreference: 'maintain-framerate',
    })
    expect(videoEncoding('720p30', 'sharp')).toMatchObject({
      maxFramerate: 30,
      degradationPreference: 'maintain-resolution',
    })
  })

  it('constraints for a live change carry only size and rate', () => {
    expect(liveVideoConstraints('720p60')).toEqual({
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 60 },
    })
  })
})
