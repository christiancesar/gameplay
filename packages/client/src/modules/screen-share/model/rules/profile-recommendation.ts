import type { ShareAspectRatio, ShareFps, ShareResolution } from '../entities/share'

type SourceProfile = {
  width?: number | null
  height?: number | null
  refreshRate?: number | null
}

type ShareProfileRecommendation = {
  availableFps: ShareFps[]
  recommended: { resolution: ShareResolution; aspectRatio: ShareAspectRatio; fps: ShareFps }
}

const RATIOS: { value: Exclude<ShareAspectRatio, 'source'>; ratio: number }[] = [
  { value: '4:3', ratio: 4 / 3 },
  { value: '16:10', ratio: 16 / 10 },
  { value: '16:9', ratio: 16 / 9 },
  { value: '21:9', ratio: 64 / 27 },
]

function closestAspectRatio(source: SourceProfile): ShareAspectRatio {
  if (!source.width || !source.height) return 'source'
  const ratio = source.width / source.height
  return [...RATIOS].sort((a, b) => Math.abs(a.ratio - ratio) - Math.abs(b.ratio - ratio))[0]?.value ?? 'source'
}

function recommendShareProfile(
  source: SourceProfile | null,
  advancedFps: readonly ShareFps[] = [],
): ShareProfileRecommendation {
  const availableFps = ([30, 60, ...advancedFps] as ShareFps[]).filter(
    (fps, index, values) => values.indexOf(fps) === index,
  )
  const recommendedFps = availableFps.at(-1) ?? 30
  return {
    availableFps,
    recommended: {
      resolution: source?.height && source.height < 1080 ? '720p' : '1080p',
      aspectRatio: source ? closestAspectRatio(source) : 'source',
      fps: recommendedFps,
    },
  }
}

export { closestAspectRatio, recommendShareProfile }
export type { ShareProfileRecommendation, SourceProfile }
