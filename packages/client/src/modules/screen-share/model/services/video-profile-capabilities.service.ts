import type { ShareFps } from '../entities/share'
import { closestAspectRatio, type SourceProfile } from '../rules/profile-recommendation'
import { presetSpec, toPreset } from '../rules/preset'

type EncodingResult = { supported: boolean; smooth: boolean }
type MediaCapabilitiesLike = {
  encodingInfo?: (configuration: never) => Promise<EncodingResult>
}

type VideoProfileCapabilitiesEnv = { mediaCapabilities?: MediaCapabilitiesLike }

const ADVANCED_FRAME_RATES = [75, 100, 120] as const

function createVideoProfileCapabilities(env: VideoProfileCapabilitiesEnv) {
  return {
    async advancedFps(source: SourceProfile | null): Promise<ShareFps[]> {
      const width = source?.width
      const height = source?.height
      const refreshRate = source?.refreshRate
      if (!width || !height || !refreshRate || !env.mediaCapabilities?.encodingInfo) return []
      const candidates = ADVANCED_FRAME_RATES.filter((fps) => fps <= refreshRate)
      const results = await Promise.all(
        candidates.map(async (fps) => {
          const profile = toPreset(height >= 1080 ? '1080p' : '720p', fps, closestAspectRatio({ width, height }))
          const spec = presetSpec(profile)
          try {
            const info = await env.mediaCapabilities!.encodingInfo!({
              type: 'webrtc',
              video: {
                contentType: 'video/VP9',
                width,
                height: Math.min(height, profile.height),
                bitrate: spec.maxBitrate,
                framerate: fps,
              },
            } as never)
            return info.supported && info.smooth ? fps : null
          } catch {
            return null
          }
        }),
      )
      return results.filter((fps): fps is (typeof ADVANCED_FRAME_RATES)[number] => fps !== null)
    },
  }
}

const videoProfileCapabilities = createVideoProfileCapabilities({
  get mediaCapabilities() {
    return navigator.mediaCapabilities as unknown as MediaCapabilitiesLike
  },
})

export { ADVANCED_FRAME_RATES, createVideoProfileCapabilities, videoProfileCapabilities }
export type { MediaCapabilitiesLike, VideoProfileCapabilitiesEnv }
