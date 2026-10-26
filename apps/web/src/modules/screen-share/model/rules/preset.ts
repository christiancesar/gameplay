import type { StreamPreset } from '@gameplay/contracts'

import type { VideoEncoding } from '@/shared/media/media-transport'

import type { ShareFps, SharePriority, ShareResolution, ShareSettings, ShareSource } from '../entities/share'

type PresetSpec = { width: number; height: number; fps: ShareFps; maxBitrate: number }

const SPECS: Record<StreamPreset, PresetSpec> = {
  '720p30': { width: 1280, height: 720, fps: 30, maxBitrate: 2_500_000 },
  '720p60': { width: 1280, height: 720, fps: 60, maxBitrate: 4_000_000 },
  '1080p30': { width: 1920, height: 1080, fps: 30, maxBitrate: 5_000_000 },
  '1080p60': { width: 1920, height: 1080, fps: 60, maxBitrate: 8_000_000 },
}

function toPreset(resolution: ShareResolution, fps: ShareFps): StreamPreset {
  return `${resolution}${fps}`
}

function presetSpec(preset: StreamPreset): PresetSpec {
  return SPECS[preset]
}

/** Back from the preset the API reports to the two choices of the setup dialog. */
function fromPreset(preset: StreamPreset): { resolution: ShareResolution; fps: ShareFps } {
  const { height, fps } = SPECS[preset]
  return { resolution: height === 1080 ? '1080p' : '720p', fps }
}

/** `motion` lets the encoder trade sharpness for speed; `detail` keeps text and edges. */
function contentHintOf(priority: SharePriority): 'motion' | 'detail' {
  return priority === 'smooth' ? 'motion' : 'detail'
}

const SURFACES: Record<ShareSource, 'monitor' | 'window' | 'browser'> = {
  screen: 'monitor',
  window: 'window',
  tab: 'browser',
}

/** Constraints for the browser's picker. Game audio keeps its dynamics, so the voice filters stay off. */
function displayMediaOptions(settings: ShareSettings): DisplayMediaStreamOptions {
  const spec = SPECS[toPreset(settings.resolution, settings.fps)]
  const video = {
    displaySurface: SURFACES[settings.source],
    width: { ideal: spec.width },
    height: { ideal: spec.height },
    frameRate: { ideal: spec.fps },
  }
  return {
    video: video as MediaTrackConstraints,
    audio: settings.includeAudio
      ? ({
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // Keeps the call's own sound out of the captured system audio where the browser supports it.
          restrictOwnAudio: true,
        } as MediaTrackConstraints)
      : false,
    selfBrowserSurface: 'exclude',
    systemAudio: settings.includeAudio ? 'include' : 'exclude',
    // Chromium 141+: offer the window's own audio (a game) instead of none. Ignored elsewhere.
    windowAudio: settings.includeAudio ? 'window' : 'exclude',
  } as DisplayMediaStreamOptions
}

/** Constraints for changing the preset of a running capture. */
function liveVideoConstraints(preset: StreamPreset): MediaTrackConstraints {
  const spec = SPECS[preset]
  return { width: { ideal: spec.width }, height: { ideal: spec.height }, frameRate: { ideal: spec.fps } }
}

function videoEncoding(preset: StreamPreset, priority: SharePriority): VideoEncoding {
  const spec = SPECS[preset]
  return {
    maxBitrate: spec.maxBitrate,
    maxFramerate: spec.fps,
    degradationPreference: priority === 'smooth' ? 'maintain-framerate' : 'maintain-resolution',
  }
}

export { contentHintOf, displayMediaOptions, fromPreset, liveVideoConstraints, presetSpec, toPreset, videoEncoding }
export type { PresetSpec }
