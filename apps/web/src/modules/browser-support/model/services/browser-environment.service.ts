import type { IceServer } from '@gameplay/contracts'

import type { BrowserSource } from '@/modules/browser-support/model/rules/detect-browser'
import type { GpuInfo } from '@/modules/browser-support/model/rules/is-acceleration-off'

import { createGpuInfoReader } from './gpu-info.service'
import { createStunIpService, type PeerConnectionLike } from './stun-ip.service'

/** What the notices read from the browser. The ViewModels tests replace the whole object. */
type BrowserEnvironment = {
  readBrowser: () => BrowserSource
  readGpu: () => GpuInfo
  gatherPublicIps: (iceServers: readonly IceServer[]) => Promise<string[]>
}

const stun = createStunIpService(
  (configuration) => new RTCPeerConnection(configuration) as unknown as PeerConnectionLike,
)

const readGpu = createGpuInfoReader(() => {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')
  return gl instanceof WebGLRenderingContext ? gl : null
})

/** The real browser. Thin glue, covered through the services it composes. */
const browserEnvironment: BrowserEnvironment = {
  readBrowser: () => navigator as unknown as BrowserSource,
  readGpu,
  gatherPublicIps: stun.gatherPublicIps,
}

export { browserEnvironment }
export type { BrowserEnvironment }
