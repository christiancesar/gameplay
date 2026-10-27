import { z } from 'zod'

// REST contract of /api/media/sfu: the browser negotiates its screen share
// connection with the Cloudflare Realtime SFU through the API, which holds
// the app secret and checks who may publish and watch.

export const SFU_UNAVAILABLE_REASONS = ['not-configured', 'budget-exhausted'] as const
export const sfuStatusResponseSchema = z.object({
  available: z.boolean(),
  reason: z.enum(SFU_UNAVAILABLE_REASONS).nullable(),
})
export type SfuStatusResponse = z.infer<typeof sfuStatusResponseSchema>

export const sessionDescriptionSchema = z.object({
  type: z.enum(['offer', 'answer']),
  sdp: z.string().min(1),
})
export type SessionDescription = z.infer<typeof sessionDescriptionSchema>

export const SFU_TRACK_KINDS = ['video', 'audio'] as const
export const sfuTrackKindSchema = z.enum(SFU_TRACK_KINDS)
export type SfuTrackKind = z.infer<typeof sfuTrackKindSchema>

// Simulcast layers sent by the streamer: full, half and quarter resolution.
export const SFU_LAYERS = ['f', 'h', 'q'] as const
export const sfuLayerSchema = z.enum(SFU_LAYERS)
export type SfuLayer = z.infer<typeof sfuLayerSchema>

// One transceiver of the browser connection, by its SDP mid.
export const sfuTrackSchema = z.object({
  mid: z.string().min(1),
  kind: sfuTrackKindSchema,
})
export type SfuTrack = z.infer<typeof sfuTrackSchema>

export const sfuSessionResponseSchema = z.object({ sessionId: z.string() })
export type SfuSessionResponse = z.infer<typeof sfuSessionResponseSchema>

// The streamer offers its screen tracks (video, and audio when shared).
export const sfuPublishRequestSchema = z.object({
  sessionDescription: sessionDescriptionSchema.extend({
    type: z.literal('offer'),
  }),
  tracks: z.array(sfuTrackSchema).min(1).max(2),
})
export type SfuPublishRequest = z.infer<typeof sfuPublishRequestSchema>

// The viewer asks for the screen of someone in the same voice room.
export const sfuWatchRequestSchema = z.object({
  streamerId: z.string().min(1),
  layer: sfuLayerSchema.default('f'),
})
export type SfuWatchRequest = z.input<typeof sfuWatchRequestSchema>

// Answer to a publish (type answer) or the SFU's offer to a watch, which the
// browser answers through renegotiate when requiresImmediateRenegotiation.
export const sfuTracksResponseSchema = z.object({
  sessionDescription: sessionDescriptionSchema.nullable(),
  requiresImmediateRenegotiation: z.boolean(),
  tracks: z.array(sfuTrackSchema),
})
export type SfuTracksResponse = z.infer<typeof sfuTracksResponseSchema>

export const sfuRenegotiateRequestSchema = z.object({
  sessionDescription: sessionDescriptionSchema.extend({
    type: z.literal('answer'),
  }),
})
export type SfuRenegotiateRequest = z.infer<typeof sfuRenegotiateRequestSchema>

// Switches the simulcast layer received on a watched video track.
export const sfuLayerRequestSchema = z.object({
  mid: z.string().min(1),
  layer: sfuLayerSchema,
})
export type SfuLayerRequest = z.infer<typeof sfuLayerRequestSchema>

// Without a session description the tracks are closed without renegotiating.
export const sfuCloseRequestSchema = z.object({
  mids: z.array(z.string().min(1)).min(1),
  sessionDescription: sessionDescriptionSchema.extend({ type: z.literal('offer') }).optional(),
})
export type SfuCloseRequest = z.infer<typeof sfuCloseRequestSchema>

export const sfuCloseResponseSchema = z.object({
  sessionDescription: sessionDescriptionSchema.nullable(),
})
export type SfuCloseResponse = z.infer<typeof sfuCloseResponseSchema>
