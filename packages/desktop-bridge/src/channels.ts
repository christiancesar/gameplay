import { serverOriginSchema } from '@gameplay/contracts'
import { z } from 'zod'

import type { DesktopChannel } from './names'

/** An application that is playing sound: `name` is its `application.name` in PipeWire. */
export const audioAppSchema = z.object({ name: z.string().min(1).max(200), binary: z.string().max(200).nullable() })
export type AudioApp = z.infer<typeof audioAppSchema>

/** Which sound the shared stream carries: that of the named applications, or of everything but the app itself. */
export const audioShareSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('apps'), apps: z.array(z.string().min(1).max(200)).min(1).max(20) }),
  z.object({ mode: z.literal('system') }),
])
export type AudioShare = z.infer<typeof audioShareSchema>

/** What goes in and what comes back on each channel. The main process checks both. */
export const desktopChannels = {
  /** The server the user chose, or null before the first choice. */
  'server:get-url': { input: z.undefined(), output: serverOriginSchema.nullable() },
  /** Keeps the server the user chose. */
  'server:set-url': { input: serverOriginSchema, output: z.void() },
  /** Whether this system can share the sound of an application (Linux with PipeWire and the native module). */
  'audio:available': { input: z.undefined(), output: z.boolean() },
  /** The applications that are playing sound now, without the app itself. */
  'audio:list-apps': { input: z.undefined(), output: z.array(audioAppSchema) },
  /** Makes the sound of the chosen applications available as a virtual microphone. False when it could not. */
  'audio:share': { input: audioShareSchema, output: z.boolean() },
  /** Takes the virtual microphone down. */
  'audio:stop': { input: z.undefined(), output: z.void() },
} as const satisfies Record<DesktopChannel, { input: z.ZodType; output: z.ZodType }>

export type DesktopChannels = typeof desktopChannels
