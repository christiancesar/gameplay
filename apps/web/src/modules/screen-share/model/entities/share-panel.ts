import type { QualityLimitation } from '../rules/quality-summary'
import type { ShareAudio, ShareFps, ShareResolution, ShareSource } from './share'

type DeliveredQuality = { width: number; height: number; fps: number; kbps: number }

/** What the share panel shows. Same shape as the View's `SharePanelState`, so it passes straight through. */
type SharePanelModel =
  | { status: 'idle' }
  | { status: 'picking' }
  | {
      status: 'live'
      source: ShareSource
      target: { resolution: ShareResolution; fps: ShareFps }
      delivering?: DeliveredQuality
      isOnTarget: boolean
      limitation: QualityLimitation
      viewerCount: number
      audio: ShareAudio
    }

/** One row of the details table. Same shape as the View's `ViewerQuality`. */
type ViewerQualityRow = {
  id: string
  name: string
  avatarUrl?: string
  quality: DeliveredQuality
  isOnTarget: boolean
  limitation: QualityLimitation
}

export type { DeliveredQuality, SharePanelModel, ViewerQualityRow }
