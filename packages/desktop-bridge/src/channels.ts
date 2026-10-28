import { serverOriginSchema } from '@gameplay/contracts'
import { z } from 'zod'

import type { DesktopChannel } from './names'

/** What goes in and what comes back on each channel. The main process checks both. */
export const desktopChannels = {
  /** The server the user chose, or null before the first choice. */
  'server:get-url': { input: z.undefined(), output: serverOriginSchema.nullable() },
  /** Keeps the server the user chose. */
  'server:set-url': { input: serverOriginSchema, output: z.void() },
} as const satisfies Record<DesktopChannel, { input: z.ZodType; output: z.ZodType }>

export type DesktopChannels = typeof desktopChannels
