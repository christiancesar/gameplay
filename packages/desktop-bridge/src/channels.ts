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
  z.object({ mode: z.literal('window'), sourceId: z.string().regex(/^window:\d+:0$/) }),
])
export type AudioShare = z.infer<typeof audioShareSchema>

/** What `desktopCapturer` calls a source: `screen:<n>:0` or `window:<n>:0`. */
const captureSourceIdSchema = z.string().regex(/^(screen|window):\S{1,64}$/)

/** A small preview or icon, as a data URL the page can put in an `<img>`. */
const imageDataUrlSchema = z
  .string()
  .max(200_000)
  .regex(/^data:image\/(png|jpeg);base64,/)

/** A screen or a window the user can share, with a preview. */
export const captureSourceSchema = z.object({
  id: captureSourceIdSchema,
  name: z.string().max(500),
  kind: z.enum(['screen', 'window']),
  thumbnail: imageDataUrlSchema.nullable(),
  appIcon: imageDataUrlSchema.nullable(),
})
export type CaptureSource = z.infer<typeof captureSourceSchema>

/**
 * What the shared sound is: everything the computer plays except this app (a screen), or only the application that
 * owns the window being shared, which the id of the window source tells (a window).
 */
export const systemAudioScopeSchema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('system') }),
  z.object({ scope: z.literal('window'), sourceId: captureSourceIdSchema }),
])
export type SystemAudioScope = z.infer<typeof systemAudioScopeSchema>

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
  /** Whether the app lists the screens and windows itself (Windows, X11); on Wayland the system picker chooses. */
  'capture:can-list': { input: z.undefined(), output: z.boolean() },
  /** The screens and windows that can be shared now, the app's own windows left out. */
  'capture:list-sources': { input: z.undefined(), output: z.array(captureSourceSchema) },
  /** The source the next screen capture takes; null forgets the choice. It holds for one capture, shortly. */
  'capture:select-source': { input: captureSourceIdSchema.nullable(), output: z.void() },
  /** Whether this system can share its sound without the app's own (Windows, with the capture helper). */
  'system-audio:available': { input: z.undefined(), output: z.boolean() },
  /** Starts capturing the sound (no scope: the whole computer) without the app; the PCM comes as `system-audio:pcm`. False when it could not. */
  'system-audio:start': { input: systemAudioScopeSchema.optional(), output: z.boolean() },
  /** Stops the capture. */
  'system-audio:stop': { input: z.undefined(), output: z.void() },
} as const satisfies Record<DesktopChannel, { input: z.ZodType; output: z.ZodType }>

export type DesktopChannels = typeof desktopChannels

/** What comes with each event. `system-audio:pcm`: PCM s16le, 48 kHz, 2 channels, interleaved, in small pieces. */
export type DesktopEvents = { 'system-audio:pcm': Uint8Array }
