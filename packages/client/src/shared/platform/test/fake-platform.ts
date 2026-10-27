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
  /** The session token the host starts with: none by default, as on the web. */
  token?: string | null
}

/** A host that records what was asked of it. No test framework inside, so Storybook can use it too. */
class FakePlatform implements Platform {
  readonly kind: Platform['kind']
  readonly capabilities: PlatformCapabilities
  readonly started: CaptureRequest[] = []
  token: string | null
  private readonly baseUrl: string
  private readonly sources: CaptureSource[]
  private readonly result: ScreenCaptureResult

  constructor({
    kind = 'browser',
    capabilities = {},
    sources = [],
    result,
    baseUrl = '',
    token = null,
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
    this.baseUrl = baseUrl
    this.token = token
  }

  readonly capture = {
    listSources: async () => this.sources,
    start: async (request: CaptureRequest) => {
      this.started.push(request)
      return this.result
    },
  }

  readonly server = {
    baseUrl: () => this.baseUrl,
    session: {
      getToken: () => this.token,
      setToken: (token: string) => {
        this.token = token
      },
      clearToken: () => {
        this.token = null
      },
    },
  }
}

export { FakePlatform }
export type { FakePlatformOptions }
