import type { LegacyStreamPreset, SfuLayer, StreamPreset, StreamProfile, StreamQualityLevel } from '@gameplay/contracts'

import type { VideoEncoding } from '@/shared/media/media-transport'

import type {
  ShareAspectRatio,
  ShareFps,
  SharePriority,
  ShareResolution,
  ShareSettings,
  ShareSource,
} from '../entities/share'

type PresetSpec = { width: number | null; height: number; fps: ShareFps; maxBitrate: number }

const ASPECT_WIDTH: Record<Exclude<ShareAspectRatio, 'source'>, number> = {
  '4:3': 4 / 3,
  '16:10': 16 / 10,
  '16:9': 16 / 9,
  // Consumer ultrawide 2560x1080 and 3440x1440 are conventionally labelled 21:9.
  '21:9': 64 / 27,
}

const LEGACY: Record<LegacyStreamPreset, StreamProfile> = {
  '720p30': { height: 720, aspectRatio: '16:9', fps: 30 },
  '720p60': { height: 720, aspectRatio: '16:9', fps: 60 },
  '1080p30': { height: 1080, aspectRatio: '16:9', fps: 30 },
  '1080p60': { height: 1080, aspectRatio: '16:9', fps: 60 },
}

function normalizePreset(preset: StreamPreset): StreamProfile {
  return typeof preset === 'string' ? LEGACY[preset] : preset
}

function toPreset(resolution: ShareResolution, fps: ShareFps, aspectRatio: ShareAspectRatio = 'source'): StreamProfile {
  return { height: resolution === '1080p' ? 1080 : 720, aspectRatio, fps }
}

/** Even dimensions avoid chroma-subsampling adjustments in common hardware encoders. */
function even(value: number): number {
  return Math.round(value / 2) * 2
}

function bitrateFor(width: number | null, height: number, fps: number): number {
  const effectiveWidth = width ?? Math.round((height * 16) / 9)
  const pixelsComparedWith720p = (effectiveWidth * height) / (1280 * 720)
  const rateComparedWith30 = Math.pow(fps / 30, 0.7)
  const calculated = 2_500_000 * pixelsComparedWith720p * rateComparedWith30
  return Math.min(20_000_000, Math.max(2_000_000, Math.round(calculated / 100_000) * 100_000))
}

function presetSpec(preset: StreamPreset): PresetSpec {
  const profile = normalizePreset(preset)
  const width = profile.aspectRatio === 'source' ? null : even(profile.height * ASPECT_WIDTH[profile.aspectRatio])
  return { width, height: profile.height, fps: profile.fps, maxBitrate: bitrateFor(width, profile.height, profile.fps) }
}

/** Back from the profile the API reports to the setup dialog choices. */
function fromPreset(preset: StreamPreset): {
  resolution: ShareResolution
  aspectRatio: ShareAspectRatio
  fps: ShareFps
} {
  const profile = normalizePreset(preset)
  return {
    resolution: profile.height === 1080 ? '1080p' : '720p',
    aspectRatio: profile.aspectRatio,
    fps: profile.fps,
  }
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
  const spec = presetSpec(toPreset(settings.resolution, settings.fps, settings.aspectRatio))
  const video = {
    displaySurface: SURFACES[settings.source],
    ...(spec.width ? { width: { ideal: spec.width } } : {}),
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
  } as DisplayMediaStreamOptions
}

/** Constraints for changing the preset of a running capture. */
function liveVideoConstraints(preset: StreamPreset): MediaTrackConstraints {
  const spec = presetSpec(preset)
  return {
    ...(spec.width ? { width: { ideal: spec.width } } : {}),
    height: { ideal: spec.height },
    frameRate: { ideal: spec.fps },
  }
}

function videoEncoding(preset: StreamPreset, priority: SharePriority): VideoEncoding {
  const spec = presetSpec(preset)
  return {
    maxBitrate: spec.maxBitrate,
    maxFramerate: spec.fps,
    degradationPreference: priority === 'smooth' ? 'maintain-framerate' : 'maintain-resolution',
  }
}

/**
 * Simulcast layers sent to the SFU: full (`f`), half (`h`) and quarter (`q`) resolution. Each viewer gets
 * the one their network carries; the lowest also drops to 15 fps.
 */
function simulcastEncodings(preset: StreamPreset): RTCRtpEncodingParameters[] {
  const spec = presetSpec(preset)
  return [
    { rid: 'f', maxBitrate: spec.maxBitrate, maxFramerate: spec.fps },
    { rid: 'h', scaleResolutionDownBy: 2, maxBitrate: Math.round(spec.maxBitrate * 0.3), maxFramerate: spec.fps },
    { rid: 'q', scaleResolutionDownBy: 4, maxBitrate: Math.round(spec.maxBitrate * 0.1), maxFramerate: 15 },
  ]
}

/** What a Direct (Mesh) viewer who asked for less gets: smaller, lighter, and at most 15 fps on Low. */
function viewerEncoding(preset: StreamPreset, priority: SharePriority, level: StreamQualityLevel): VideoEncoding {
  const encoding = videoEncoding(preset, priority)
  if (level === 'medium') {
    return { ...encoding, maxBitrate: Math.round(encoding.maxBitrate * 0.35), scaleResolutionDownBy: 2 }
  }
  if (level === 'low') {
    return {
      ...encoding,
      maxBitrate: Math.round(encoding.maxBitrate * 0.1),
      maxFramerate: Math.min(15, encoding.maxFramerate),
      scaleResolutionDownBy: 4,
    }
  }
  return encoding
}

/** The simulcast layer a viewer asks the SFU for. Auto starts on the full one and lets the SFU step down. */
function layerFor(level: StreamQualityLevel): SfuLayer {
  if (level === 'medium') return 'h'
  if (level === 'low') return 'q'
  return 'f'
}

export {
  layerFor,
  viewerEncoding,
  simulcastEncodings,
  contentHintOf,
  displayMediaOptions,
  fromPreset,
  liveVideoConstraints,
  presetSpec,
  normalizePreset,
  toPreset,
  videoEncoding,
}
export type { PresetSpec }
