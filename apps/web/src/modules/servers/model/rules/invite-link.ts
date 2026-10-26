/** Shareable link of an invite code. */
function inviteLink(origin: string, code: string): string {
  return `${origin}/i/${code}`
}

export { inviteLink }
