import { describe, expect, it } from 'vitest'

import {
  contentHintOf,
  displayMediaOptions,
  fromPreset,
  liveVideoConstraints,
  normalizePreset,
  presetSpec,
  toPreset,
  videoEncoding,
} from './preset'

describe('preset rules', () => {
  it('makes structured profiles and reads legacy presets', () => {
    expect(toPreset('1080p', 120, '21:9')).toEqual({ height: 1080, aspectRatio: '21:9', fps: 120 })
    expect(normalizePreset('720p30')).toEqual({ height: 720, aspectRatio: '16:9', fps: 30 })
    expect(fromPreset('1080p60')).toEqual({ resolution: '1080p', aspectRatio: '16:9', fps: 60 })
  })

  it('calculates dimensions and bitrate from pixels per second', () => {
    expect(presetSpec(toPreset('720p', 30, '16:9'))).toEqual({
      width: 1280,
      height: 720,
      fps: 30,
      maxBitrate: 2_500_000,
    })
    const standard = presetSpec(toPreset('1080p', 60, '16:9'))
    const ultrawide = presetSpec(toPreset('1080p', 60, '21:9'))
    expect(standard).toMatchObject({ width: 1920, height: 1080, fps: 60 })
    expect(ultrawide).toMatchObject({ width: 2560, height: 1080, fps: 60 })
    expect(ultrawide.maxBitrate).toBeGreaterThan(standard.maxBitrate)
  })

  it('asks the picker for the chosen aspect, height and rate', () => {
    const options = displayMediaOptions({
      source: 'tab',
      resolution: '720p',
      aspectRatio: '16:10',
      fps: 60,
      includeAudio: false,
      audioApps: [],
    })
    expect(options.video).toEqual({
      displaySurface: 'browser',
      width: { ideal: 1152 },
      height: { ideal: 720 },
      frameRate: { ideal: 60 },
    })
    expect(options.audio).toBe(false)
  })

  it('keeps native aspect by omitting the width constraint', () => {
    expect(
      displayMediaOptions({
        source: 'screen',
        resolution: '1080p',
        aspectRatio: 'source',
        fps: 30,
        includeAudio: false,
        audioApps: [],
      }).video,
    ).toEqual({ displaySurface: 'monitor', height: { ideal: 1080 }, frameRate: { ideal: 30 } })
  })

  it('keeps voice filters off game audio', () => {
    const options = displayMediaOptions({
      source: 'tab',
      resolution: '1080p',
      aspectRatio: '16:9',
      fps: 30,
      includeAudio: true,
      audioApps: [],
    })
    expect(options.audio).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: false })
  })

  it('smooth keeps frame rate while sharp keeps resolution', () => {
    const profile = toPreset('1080p', 60, '16:9')
    expect(contentHintOf('smooth')).toBe('motion')
    expect(contentHintOf('sharp')).toBe('detail')
    expect(videoEncoding(profile, 'smooth')).toMatchObject({
      maxFramerate: 60,
      degradationPreference: 'maintain-framerate',
    })
    expect(videoEncoding(profile, 'sharp')).toMatchObject({ degradationPreference: 'maintain-resolution' })
  })

  it('constraints for a live change carry the calculated size and rate', () => {
    expect(liveVideoConstraints(toPreset('1080p', 75, '21:9'))).toEqual({
      width: { ideal: 2560 },
      height: { ideal: 1080 },
      frameRate: { ideal: 75 },
    })
  })
})
