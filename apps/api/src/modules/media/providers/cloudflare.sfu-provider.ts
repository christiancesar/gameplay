import { Logger } from '@nestjs/common'
import { sessionDescriptionSchema, type SessionDescription, type SfuLayer } from '@gameplay/contracts'
import { z } from 'zod'
import { SfuFailedError } from '../errors/media.errors'
import { type LocalTrack, type Negotiation, type RemoteTrack, SfuProvider } from '../sfu.provider'

type Options = {
  appId: string
  appToken: string
  // Injected by the tests.
  fetch?: typeof fetch
}

const API_URL = 'https://rtc.live.cloudflare.com/v1/apps'
const TIMEOUT_MS = 5000

// Cloudflare answers some failures with 200 and an errorCode, for the whole
// request or per track.
const failure = { errorCode: z.string().optional(), errorDescription: z.string().optional() }
const tracksResponseSchema = z.object({
  ...failure,
  sessionDescription: sessionDescriptionSchema.optional(),
  requiresImmediateRenegotiation: z.boolean().optional(),
  tracks: z.array(z.object({ ...failure, mid: z.string().optional(), trackName: z.string().optional() })).optional(),
})
const sessionResponseSchema = z.object({ ...failure, sessionId: z.string().optional() })

// Lower layers take over when the chosen one is missing or the viewer's
// network can't keep up (f, then h, then q).
function simulcast(layer: SfuLayer) {
  return { preferredRid: layer, priorityOrdering: 'asciibetical', ridNotAvailable: 'asciibetical' }
}

// Cloudflare Realtime SFU over its HTTPS API (Connection API, 2024-05-21).
export class CloudflareSfuProvider extends SfuProvider {
  readonly configured = true
  private readonly logger = new Logger(CloudflareSfuProvider.name)

  constructor(private readonly options: Options) {
    super()
  }

  async newSession(): Promise<string> {
    const { sessionId } = await this.call('POST', '/sessions/new', undefined, sessionResponseSchema)
    if (!sessionId) throw new SfuFailedError()
    return sessionId
  }

  async publish(sessionId: string, offer: SessionDescription, tracks: LocalTrack[]): Promise<Negotiation> {
    const body = { sessionDescription: offer, tracks: tracks.map((track) => ({ location: 'local', ...track })) }
    return negotiation(await this.call('POST', `/sessions/${sessionId}/tracks/new`, body, tracksResponseSchema))
  }

  async pull(sessionId: string, tracks: RemoteTrack[]): Promise<Negotiation> {
    const body = { tracks: tracks.map(remote) }
    return negotiation(await this.call('POST', `/sessions/${sessionId}/tracks/new`, body, tracksResponseSchema))
  }

  async renegotiate(sessionId: string, answer: SessionDescription): Promise<void> {
    const body = { sessionDescription: answer }
    await this.call('PUT', `/sessions/${sessionId}/renegotiate`, body, z.object(failure))
  }

  async setLayer(sessionId: string, mid: string, track: RemoteTrack & { layer: SfuLayer }): Promise<void> {
    const body = { tracks: [{ ...remote(track), mid }] }
    await this.call('PUT', `/sessions/${sessionId}/tracks/update`, body, tracksResponseSchema)
  }

  async close(sessionId: string, mids: string[], offer?: SessionDescription): Promise<SessionDescription | null> {
    const body = { tracks: mids.map((mid) => ({ mid })), sessionDescription: offer, force: !offer }
    const response = await this.call('PUT', `/sessions/${sessionId}/tracks/close`, body, tracksResponseSchema)
    return response.sessionDescription ?? null
  }

  private async call<T extends z.ZodType<Failure & { tracks?: Failure[] }>>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body: unknown,
    schema: T,
  ): Promise<z.infer<T>> {
    const { appId, appToken, fetch: doFetch = fetch } = this.options
    let response: Response
    try {
      response = await doFetch(`${API_URL}/${appId}${path}`, {
        method,
        headers: { authorization: `Bearer ${appToken}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      this.logger.warn({ err: error, path: redact(path) }, 'Cloudflare SFU did not answer')
      throw new SfuFailedError()
    }
    const parsed = schema.safeParse(await response.json().catch(() => ({})))
    const failed = parsed.success ? firstFailure(parsed.data) : undefined
    if (!response.ok || !parsed.success || failed) {
      const { errorCode, errorDescription } = failed ?? {}
      this.logger.warn(
        { status: response.status, errorCode, errorDescription, path: redact(path) },
        'Cloudflare SFU refused',
      )
      throw new SfuFailedError()
    }
    return parsed.data
  }
}

function remote({ sessionId, trackName, layer }: RemoteTrack) {
  return { location: 'remote', sessionId, trackName, ...(layer && { simulcast: simulcast(layer) }) }
}

type Failure = { errorCode?: string; errorDescription?: string }

// The request's own error, or the first one of its tracks.
function firstFailure(data: Failure & { tracks?: Failure[] }): Failure | undefined {
  if (data.errorCode) return data
  return data.tracks?.find((track) => track.errorCode)
}

function negotiation(response: z.infer<typeof tracksResponseSchema>): Negotiation {
  return {
    sessionDescription: response.sessionDescription ?? null,
    requiresImmediateRenegotiation: response.requiresImmediateRenegotiation ?? false,
    tracks: (response.tracks ?? []).map(({ mid, trackName }) => ({ mid: mid ?? '', trackName: trackName ?? '' })),
  }
}

// Session ids are not secret, but keep the logs about the operation.
function redact(path: string): string {
  return path.replace(/\/sessions\/[^/]+/, '/sessions/:id')
}
