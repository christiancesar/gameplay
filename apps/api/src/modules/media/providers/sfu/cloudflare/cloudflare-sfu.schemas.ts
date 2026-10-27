import { sessionDescriptionSchema, type SfuLayer } from '@gameplay/contracts'
import { z } from 'zod'

// Shapes of the Cloudflare Realtime SFU API (Connection API, 2024-05-21).

// Cloudflare answers some failures with 200 and an errorCode, for the whole
// request or per track.
export const failure = { errorCode: z.string().optional(), errorDescription: z.string().optional() }
export const tracksResponseSchema = z.object({
  ...failure,
  sessionDescription: sessionDescriptionSchema.optional(),
  requiresImmediateRenegotiation: z.boolean().optional(),
  tracks: z.array(z.object({ ...failure, mid: z.string().optional(), trackName: z.string().optional() })).optional(),
})
export const sessionResponseSchema = z.object({ ...failure, sessionId: z.string().optional() })

// Lower layers take over when the chosen one is missing or the viewer's
// network can't keep up (f, then h, then q).
export function simulcast(layer: SfuLayer) {
  return { preferredRid: layer, priorityOrdering: 'asciibetical', ridNotAvailable: 'asciibetical' }
}

export type Failure = { errorCode?: string; errorDescription?: string }

// The request's own error, or the first one of its tracks.
export function firstFailure(data: Failure & { tracks?: Failure[] }): Failure | undefined {
  if (data.errorCode) return data
  return data.tracks?.find((track) => track.errorCode)
}
