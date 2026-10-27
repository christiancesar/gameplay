import { serverInviteCodeSchema } from '@gameplay/contracts'

/** Takes the last path segment of a pasted invite link (`https://host/i/CODE?x#y`), or the text itself for a bare code. */
function extractInviteCode(input: string): string {
  const path = input.trim().split(/[?#]/)[0]
  return (path.split('/').filter(Boolean).pop() ?? '').toUpperCase()
}

/** Accepts the 8-char code or the whole invite link. Returns the normalized code, or null when it is not valid. */
function parseInviteCode(input: string): string | null {
  const parsed = serverInviteCodeSchema.safeParse(extractInviteCode(input))
  return parsed.success ? parsed.data : null
}

export { extractInviteCode, parseInviteCode }
