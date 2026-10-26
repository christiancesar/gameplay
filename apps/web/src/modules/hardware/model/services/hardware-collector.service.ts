import type { ReportDeviceRequest } from '@gameplay/contracts'

import type { ScreenInfo } from '@/modules/hardware/model/services/displays.service'

type CollectedHardwareInput = ReportDeviceRequest['collected']
type CodecSupport = NonNullable<CollectedHardwareInput['videoEncoding']['h264']>

/** What the report reads from `navigator`. Every member is optional: browsers expose different subsets. */
type NavigatorLike = {
  userAgentData?: {
    platform?: string
    brands?: readonly { brand: string; version: string }[]
    getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>
  }
  hardwareConcurrency?: number
  deviceMemory?: number
  gpu?: unknown
  connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }
  mediaCapabilities?: {
    encodingInfo?: (configuration: unknown) => Promise<{ supported: boolean; smooth: boolean; powerEfficient: boolean }>
  }
}

type HardwareEnv = {
  navigator: NavigatorLike
  /** Unmasked WebGL vendor and renderer, or null when WebGL or the debug extension is missing. */
  readGpu: () => { vendor: string | null; renderer: string | null } | null
  readScreens: () => Promise<ScreenInfo[]>
}

type HardwareCollector = {
  /** `withDisplays` only after the monitors permission was granted. */
  collect: (options: { withDisplays: boolean }) => Promise<CollectedHardwareInput>
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render/i
const GREASE_BRAND = /not.?a.?brand|^$/i

// Screen share runs over WebRTC, at 1080p60.
const ENCODING_CODECS = {
  h264: 'video/H264',
  vp9: 'video/VP9',
  av1: 'video/AV1',
} as const
const ENCODING_BITRATE = 6_000_000

/** The brand to show: a real name over the generic "Chromium", never the grease entry. */
function pickBrowser(brands: readonly { brand: string; version: string }[] | undefined) {
  const real = (brands ?? []).filter((entry) => !GREASE_BRAND.test(entry.brand))
  const chosen = real.find((entry) => entry.brand !== 'Chromium') ?? real[0]
  return { brand: chosen?.brand ?? null, version: chosen?.version ?? null }
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

async function attempt<T>(read: () => Promise<T> | T): Promise<T | null> {
  try {
    return await read()
  } catch {
    return null
  }
}

function createHardwareCollector(env: HardwareEnv): HardwareCollector {
  const { navigator: nav } = env

  async function collectOs() {
    const high = await attempt(
      () => nav.userAgentData?.getHighEntropyValues?.(['platformVersion', 'architecture', 'bitness']) ?? null,
    )
    return {
      platform: textOrNull(nav.userAgentData?.platform),
      version: textOrNull(high?.platformVersion),
      architecture: textOrNull(high?.architecture),
      bitness: textOrNull(high?.bitness),
    }
  }

  async function encoding(contentType: string): Promise<CodecSupport | null> {
    const info = await attempt(() =>
      nav.mediaCapabilities?.encodingInfo?.({
        type: 'webrtc',
        video: { contentType, width: 1920, height: 1080, bitrate: ENCODING_BITRATE, framerate: 60 },
      }),
    )
    return info ? { supported: info.supported, smooth: info.smooth, powerEfficient: info.powerEfficient } : null
  }

  async function collectDisplays(): Promise<CollectedHardwareInput['displays']> {
    const screens = await attempt(env.readScreens)
    if (!screens) return null
    return screens.map((screen) => ({
      label: textOrNull(screen.label),
      width: Math.round(screen.width),
      height: Math.round(screen.height),
      scaleFactor: screen.devicePixelRatio,
      refreshRate: null,
      isPrimary: screen.isPrimary ?? null,
      isInternal: screen.isInternal ?? null,
    }))
  }

  return {
    async collect({ withDisplays }) {
      const [os, h264, vp9, av1, displays] = await Promise.all([
        collectOs(),
        encoding(ENCODING_CODECS.h264),
        encoding(ENCODING_CODECS.vp9),
        encoding(ENCODING_CODECS.av1),
        withDisplays ? collectDisplays() : null,
      ])
      const gpu = await attempt(env.readGpu)
      const connection = nav.connection

      return {
        os,
        browser: pickBrowser(nav.userAgentData?.brands),
        logicalCores: numberOrNull(nav.hardwareConcurrency),
        deviceMemoryGb: numberOrNull(nav.deviceMemory),
        gpu: {
          vendor: gpu?.vendor ?? null,
          renderer: gpu?.renderer ?? null,
          hardwareAcceleration: gpu?.renderer ? !SOFTWARE_RENDERER.test(gpu.renderer) : null,
          webgpu: 'gpu' in nav,
        },
        videoEncoding: { h264, vp9, av1 },
        network: {
          effectiveType: textOrNull(connection?.effectiveType),
          downlinkMbps: numberOrNull(connection?.downlink),
          rttMs: numberOrNull(connection?.rtt),
          saveData: typeof connection?.saveData === 'boolean' ? connection.saveData : null,
        },
        displays,
      }
    },
  }
}

export { createHardwareCollector, pickBrowser }
export type { CollectedHardwareInput, HardwareCollector, HardwareEnv, NavigatorLike }
