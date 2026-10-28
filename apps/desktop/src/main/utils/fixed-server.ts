import { serverOriginSchema } from '@gameplay/contracts'

/**
 * The server a build is tied to, from `VITE_SERVER_URL` at build time. Empty means none (development, where the
 * user picks one). A value that is not a server origin stops the app at start rather than falling back to a choice.
 */
function fixedServerFrom(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = serverOriginSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(`VITE_SERVER_URL is not an origin the app can talk to: ${trimmed}`)
  return parsed.data
}

export { fixedServerFrom }
