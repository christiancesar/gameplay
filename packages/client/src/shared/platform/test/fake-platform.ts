import type { ScreenCaptureResult } from '@/shared/media/screen-capture'

import type { CaptureRequest, CaptureSource, Platform, PlatformCapabilities } from '../platform'

type FakePlatformOptions = {
  kind?: Platform['kind']
  capabilities?: Partial<PlatformCapabilities>
  sources?: CaptureSource[]
  /** What `capture.start` answers; a refusal by default, as a browser without screen capture. */
  result?: ScreenCaptureResult
}

/** A host that records what was asked of it. No test framework inside, so Storybook can use it too. */
class FakePlatform implements Platform {
  readonly kind: Platform['kind']
  readonly capabilities: PlatformCapabilities
  readonly started: CaptureRequest[] = []
  private readonly sources: CaptureSource[]
  private readonly result: ScreenCaptureResult

  constructor({ kind = 'browser', capabilities = {}, sources = [], result }: FakePlatformOptions = {}) {
    this.kind = kind
    this.capabilities = {
      listSources: false,
      windowAudio: false,
      systemAudio: false,
      globalHotkeys: false,
      ...capabilities,
    }
    this.sources = sources
    this.result = result ?? { ok: false, reason: 'unsupported' }
  }

  readonly capture = {
    listSources: async () => this.sources,
    start: async (request: CaptureRequest) => {
      this.started.push(request)
      return this.result
    },
  }
}

export { FakePlatform }
export type { FakePlatformOptions }
