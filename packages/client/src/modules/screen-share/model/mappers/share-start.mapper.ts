import type { Measurement } from '@/shared/lib/telemetry/telemetry'

import type { CapturePlatform } from '../rules/capture-platform'
import type { ShareStartReport } from '../services/share-session.service'

/** One measurement per share that goes live: whether the audio asked for came, and where. Nothing about who. */
function toShareStartMeasurement(report: ShareStartReport, platform: CapturePlatform): Measurement {
  return {
    name: 'screen_share_start',
    values: {
      audio_requested: report.audioRequested ? 1 : 0,
      audio_received: report.audioReceived ? 1 : 0,
    },
    attributes: {
      source: report.source,
      surface: report.surface,
      browser: platform.browser,
      engine: platform.engine,
      chromium_major: String(platform.chromiumMajor),
      os: platform.os,
    },
  }
}

export { toShareStartMeasurement }
