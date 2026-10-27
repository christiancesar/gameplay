import { z } from 'zod'
import { announcementSchema } from '../notifications/notification.js'

// What the platform admin turns on and off: screen share through the SFU,
// screen share straight between people (mesh), and the TURN relay used by
// voice and mesh when a direct connection fails.
export const MEDIA_RESOURCES = ['sfu', 'mesh', 'turn'] as const
export const mediaResourceSchema = z.enum(MEDIA_RESOURCES)
export type MediaResource = z.infer<typeof mediaResourceSchema>

export const mediaSettingsSchema = z.object({ sfu: z.boolean(), mesh: z.boolean(), turn: z.boolean() })
export type MediaSettings = z.infer<typeof mediaSettingsSchema>

// Per server; null follows the global setting.
export const serverMediaOverridesSchema = z.object({
  sfu: z.boolean().nullable(),
  mesh: z.boolean().nullable(),
  turn: z.boolean().nullable(),
})
export type ServerMediaOverrides = z.infer<typeof serverMediaOverridesSchema>

// Sent along with a change: to the people it cut off, to the server's
// members (server changes only) or to everyone.
export const MEDIA_NOTICE_AUDIENCES = ['affected', 'members', 'everyone'] as const
export const mediaNoticeSchema = announcementSchema.extend({ audience: z.enum(MEDIA_NOTICE_AUDIENCES) })
export type MediaNotice = z.infer<typeof mediaNoticeSchema>

export const updateMediaSettingsRequestSchema = z.object({
  settings: mediaSettingsSchema,
  notice: mediaNoticeSchema.extend({ audience: z.enum(['affected', 'everyone']) }).optional(),
})
export type UpdateMediaSettingsRequest = z.infer<typeof updateMediaSettingsRequestSchema>

export const updateServerMediaRequestSchema = z.object({
  overrides: serverMediaOverridesSchema,
  notice: mediaNoticeSchema.optional(),
})
export type UpdateServerMediaRequest = z.infer<typeof updateServerMediaRequestSchema>

// How many people got the notice (0 without one).
export const mediaChangeResponseSchema = z.object({ notified: z.number().int().min(0) })
export type MediaChangeResponse = z.infer<typeof mediaChangeResponseSchema>

// People in voice rooms who would be cut off if each resource went off now.
export const mediaImpactSchema = z.object({
  sfu: z.number().int().min(0),
  mesh: z.number().int().min(0),
  turn: z.number().int().min(0),
})
export type MediaImpact = z.infer<typeof mediaImpactSchema>

export const MEDIA_PROVIDER_STATES = ['ready', 'not-configured', 'failing'] as const
export const mediaProviderStatusSchema = z.object({
  // Who delivers the resource (cloudflare, coturn); null when nobody is set up.
  name: z.string().nullable(),
  state: z.enum(MEDIA_PROVIDER_STATES),
})
export type MediaProviderStatus = z.infer<typeof mediaProviderStatusSchema>

// Cloudflare bills SFU and TURN egress together: the first 1,000 GB of the
// month are free for both.
export const REALTIME_FREE_TIER_GB = 1000

export const REALTIME_USAGE_SOURCE_STATES = ['ready', 'not-configured', 'failing'] as const

// Traffic of the current month (UTC). Cloudflare's own numbers come from its
// analytics API and lag a few minutes; the SFU also has what the viewers
// report, live. The SFU budget counts the larger of the two.
export const realtimeUsageSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  budgetGb: z.number().int().min(0),
  freeTierGb: z.number().int().min(0),
  sfu: z.object({
    reportedBytes: z.number().int().min(0),
    cloudflareBytes: z.number().int().min(0).nullable(),
  }),
  turn: z.object({ cloudflareBytes: z.number().int().min(0).nullable() }),
  cloudflare: z.object({
    state: z.enum(REALTIME_USAGE_SOURCE_STATES),
    checkedAt: z.iso.datetime().nullable(),
  }),
})
export type RealtimeUsage = z.infer<typeof realtimeUsageSchema>

// Periods of the usage card, counted back from now. Cloudflare keeps 32 days
// of analytics, so a custom range (UTC days, inclusive) stays inside the last
// USAGE_MAX_DAYS.
export const USAGE_PERIODS = ['30m', '6h', '12h', '24h', '7d', '30d', 'custom'] as const
export type UsagePeriod = (typeof USAGE_PERIODS)[number]
export const USAGE_MAX_DAYS = 30

export const realtimeUsageQuerySchema = z
  .object({ period: z.enum(USAGE_PERIODS), from: z.iso.date().optional(), to: z.iso.date().optional() })
  .refine((query) => query.period !== 'custom' || (query.from && query.to && query.from <= query.to), {
    message: 'A custom period needs from <= to.',
  })
export type RealtimeUsageQuery = z.infer<typeof realtimeUsageQuerySchema>

// The step of the usage chart, picked from the length of the period.
export const USAGE_BUCKETS = ['minute', 'five-minutes', 'fifteen-minutes', 'hour', 'day'] as const
export type UsageBucket = (typeof USAGE_BUCKETS)[number]

const egressBytesSchema = z.number().int().min(0).nullable()

// SFU and TURN egress Cloudflare billed in a period: the totals and one point
// per bucket (zero where nothing went out). null where that resource has no
// Cloudflare app or key; no points when Cloudflare can't be read.
export const realtimeUsagePeriodSchema = z.object({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  bucket: z.enum(USAGE_BUCKETS),
  sfu: z.object({ cloudflareBytes: egressBytesSchema }),
  turn: z.object({ cloudflareBytes: egressBytesSchema }),
  points: z.array(z.object({ at: z.iso.datetime(), sfuBytes: egressBytesSchema, turnBytes: egressBytesSchema })),
  cloudflare: z.object({
    state: z.enum(REALTIME_USAGE_SOURCE_STATES),
    checkedAt: z.iso.datetime().nullable(),
  }),
})
export type RealtimeUsagePeriod = z.infer<typeof realtimeUsagePeriodSchema>

// Monthly SFU budget; 0 keeps the SFU off for new shares.
export const updateSfuBudgetRequestSchema = z.object({ budgetGb: z.number().int().min(0).max(100_000) })
export type UpdateSfuBudgetRequest = z.infer<typeof updateSfuBudgetRequestSchema>

export const adminMediaResponseSchema = z.object({
  settings: mediaSettingsSchema,
  usage: realtimeUsageSchema,
  providers: z.object({ sfu: mediaProviderStatusSchema, turn: mediaProviderStatusSchema }),
  // Servers that differ from the global settings.
  exceptions: z.array(
    z.object({ serverId: z.string(), serverName: z.string(), overrides: serverMediaOverridesSchema }),
  ),
})
export type AdminMediaResponse = z.infer<typeof adminMediaResponseSchema>

// What a server offers its members right now.
export const SERVER_SFU_UNAVAILABLE_REASONS = ['disabled', 'not-configured', 'budget-exhausted'] as const
export const serverMediaSchema = z.object({
  sfu: z.object({ available: z.boolean(), reason: z.enum(SERVER_SFU_UNAVAILABLE_REASONS).nullable() }),
  mesh: z.object({ available: z.boolean() }),
  turn: z.object({ available: z.boolean() }),
})
export type ServerMedia = z.infer<typeof serverMediaSchema>
