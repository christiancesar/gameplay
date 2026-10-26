import { parseInviteCode } from './parse-invite-code'

const INVITE_PATH_PATTERN = /^\/i\/([^/?#]+)$/

/** Path of the invite landing page; used as the `redirect` of sign-in. */
function inviteLandingPath(code: string): string {
  return `/i/${code}`
}

/** The invite code behind a `/i/CODE` path (a sign-in `redirect`), or null for any other path. */
function inviteCodeFromPath(path: string | undefined): string | null {
  const match = path ? INVITE_PATH_PATTERN.exec(path) : null
  return match ? parseInviteCode(match[1]) : null
}

export { inviteCodeFromPath, inviteLandingPath }
