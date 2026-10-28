/** The API keeps a dropped seat for 30 s (`ROOM_RECONNECT_GRACE_MS`); after that there is nothing to take back. */
const RESUME_WINDOW_MS = 30_000

/** The call of this tab, as kept across a reload. `leftAt` is set when the page goes away. */
type RememberedCall = { serverId: string; roomId: string; leftAt: number | null }

/** The room to go back to after a reload, if the page left it recently enough. */
function callToResume(saved: RememberedCall | null, now: number): { serverId: string; roomId: string } | null {
  if (!saved || saved.leftAt === null) return null
  const elapsed = now - saved.leftAt
  if (elapsed < 0 || elapsed > RESUME_WINDOW_MS) return null
  return { serverId: saved.serverId, roomId: saved.roomId }
}

export { RESUME_WINDOW_MS, callToResume }
export type { RememberedCall }
