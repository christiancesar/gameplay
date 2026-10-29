import { z } from 'zod'

const attemptIdSchema = z.string().min(1).max(64)
const atSchema = z.iso.datetime()
const modeSchema = z.enum(['mesh', 'sfu'])
const numberOrNull = z.number().finite().nullable()
const diagnosticsStatusSchema = z.object({
  diagnostics: z.boolean(),
  cdpPort: z.number().int().positive().nullable(),
  mainInspectPort: z.number().int().positive().nullable(),
  devtools: z.boolean(),
})

const diagnosticEventSchema = z.discriminatedUnion('name', [
  z.object({
    name: z.literal('share.capture.started'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({
      surface: z.enum(['monitor', 'window', 'browser', 'unknown']),
      width: z.number().int().positive().nullable(),
      height: z.number().int().positive().nullable(),
      fps: numberOrNull,
      audioRequested: z.boolean(),
      audioReceived: z.boolean(),
    }),
  }),
  z.object({
    name: z.literal('share.capture.rejected'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({ reason: z.enum(['cancelled', 'unsupported', 'failed', 'not-in-call']) }),
  }),
  z.object({
    name: z.literal('share.encoding.applied'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({ mode: modeSchema, degradationPreference: z.string().max(32), encodingCount: z.number().int() }),
  }),
  z.object({
    name: z.literal('share.encoding.failed'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({ mode: modeSchema, errorName: z.string().max(100), errorMessage: z.string().max(500) }),
  }),
  z.object({
    name: z.literal('share.quality.changed'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({ applied: z.boolean(), width: numberOrNull, height: numberOrNull, fps: numberOrNull }),
  }),
  z.object({
    name: z.literal('share.stats.sampled'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({
      transport: modeSchema,
      width: z.number().int().nonnegative(),
      height: z.number().int().nonnegative(),
      fps: z.number().finite().nonnegative(),
      kbps: z.number().finite().nonnegative().nullable(),
      limitation: z.enum(['none', 'bandwidth', 'cpu', 'other']),
      viewerCount: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    name: z.literal('audio.state.changed'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({ state: z.enum(['off', 'missing', 'silent', 'active']) }),
  }),
  z.object({
    name: z.literal('network.state.changed'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({
      state: z.enum(['capture', 'publishing', 'connected', 'failed', 'stopped']),
      detail: z.string().max(160).nullable(),
    }),
  }),
  z.object({
    name: z.literal('lifecycle.state.changed'),
    attemptId: attemptIdSchema,
    at: atSchema,
    data: z.object({ state: z.enum(['started', 'stopped', 'rejected']), detail: z.string().max(160).nullable() }),
  }),
])

type DiagnosticEvent = z.infer<typeof diagnosticEventSchema>

export { diagnosticEventSchema }
export { diagnosticsStatusSchema }
export type { DiagnosticEvent, DiagnosticsStatus }

type DiagnosticsStatus = z.infer<typeof diagnosticsStatusSchema>
