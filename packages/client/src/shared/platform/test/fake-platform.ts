import type { ScreenCaptureResult } from '@/shared/media/screen-capture'

import type { CaptureRequest, CaptureSource, Platform, PlatformCapabilities } from '../platform'

type FakePlatformOptions = {
  kind?: Platform['kind']
  capabilities?: Partial<PlatformCapabilities>
  sources?: CaptureSource[]
  /** What `capture.start` answers; a refusal by default, as a browser without screen capture. */
  result?: ScreenCaptureResult
  /** Origin of the API: empty (same origin) by default, as on the web. */
  baseUrl?: string
  /** Makes the host one where the user picks the server; `chosen` is the one picked so far. */
  serverChoice?: { chosen: string | null }
}

/** A host that records what was asked of it. No test framework inside, so Storybook can use it too. */
class FakePlatform implements Platform {
  readonly kind: Platform['kind']
  readonly capabilities: PlatformCapabilities
  readonly started: CaptureRequest[] = []
  chosen: string | null
  readonly server: Platform['server']
  private baseUrl: string
  private readonly sources: CaptureSource[]
  private readonly result: ScreenCaptureResult

  constructor({
    kind = 'browser',
    capabilities = {},
    sources = [],
    result,
    baseUrl = '',
    serverChoice,
  }: FakePlatformOptions = {}) {
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
    this.baseUrl = serverChoice?.chosen ?? baseUrl
    this.chosen = serverChoice?.chosen ?? null
    this.server = {
      baseUrl: () => this.baseUrl,
      chooser:
        serverChoice === undefined
          ? undefined
          : {
              current: () => this.chosen,
              choose: (origin) => {
                this.chosen = origin
                this.baseUrl = origin
              },
            },
    }
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
