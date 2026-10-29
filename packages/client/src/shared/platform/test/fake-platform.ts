import type { ScreenCaptureHandle, ScreenCaptureResult } from '@/shared/media/screen-capture'

import type {
  AudioApp,
  CaptureRequest,
  CaptureSource,
  Platform,
  PlatformCapabilities,
  TelemetryConfig,
} from '../platform'

type FakePlatformOptions = {
  kind?: Platform['kind']
  capabilities?: Partial<PlatformCapabilities>
  sources?: CaptureSource[]
  /** The applications playing sound, for a host with `appAudio`. */
  audioApps?: AudioApp[]
  /** What `capture.start` answers; a refusal by default, as a browser without screen capture. */
  result?: ScreenCaptureResult
  /** Origin of the API: empty (same origin) by default, as on the web. */
  baseUrl?: string
  /** Makes the host one where the user picks the server; `chosen` is the one picked so far. */
  serverChoice?: { chosen: string | null }
  /** Telemetry is off by default, as in a build with no DSN. */
  telemetry?: Partial<TelemetryConfig>
}

/** A host that records what was asked of it. No test framework inside, so Storybook can use it too. */
class FakePlatform implements Platform {
  readonly kind: Platform['kind']
  readonly capabilities: PlatformCapabilities
  readonly started: CaptureRequest[] = []
  readonly stopped: ScreenCaptureHandle[] = []
  chosen: string | null
  readonly server: Platform['server']
  readonly telemetry: TelemetryConfig
  readonly diagnostics = {
    enabled: false,
    status: { diagnostics: false, cdpPort: null, mainInspectPort: null, devtools: false },
    record: () => undefined,
  }
  private baseUrl: string
  private readonly sources: CaptureSource[]
  private readonly playing: AudioApp[]
  private readonly result: ScreenCaptureResult

  constructor({
    kind = 'browser',
    capabilities = {},
    sources = [],
    audioApps = [],
    result,
    baseUrl = '',
    serverChoice,
    telemetry = {},
  }: FakePlatformOptions = {}) {
    this.kind = kind
    this.capabilities = {
      listSources: false,
      windowAudio: false,
      systemAudio: false,
      appAudio: false,
      systemAudioWithoutApp: false,
      globalHotkeys: false,
      ...capabilities,
    }
    this.telemetry = { app: 'web', environment: 'test', release: 'test', sentry: null, faro: null, ...telemetry }
    this.sources = sources
    this.playing = audioApps
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
    stop: (capture: ScreenCaptureHandle) => {
      this.stopped.push(capture)
    },
    listAudioApps: async () => this.playing,
  }
}

export { FakePlatform }
export type { FakePlatformOptions }
