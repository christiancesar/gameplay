import type { RememberedCall } from '../rules/resume-call'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Remembers the room of this tab so a reload can go back to it. */
type CallMemory = {
  read(): RememberedCall | null
  remember(call: { serverId: string; roomId: string }): void
  /** The page is going away: stamps when, so the next load knows if the seat is still held. */
  markLeft(now: number): void
  forget(): void
}

const KEY = 'gameplay:voice-call'

/** Kept in sessionStorage: one per tab, survives a reload. Storage can be blocked, so it never throws. */
function createCallMemory(getStorage: () => StorageLike): CallMemory {
  const read = (): RememberedCall | null => {
    try {
      const raw = getStorage().getItem(KEY)
      if (!raw) return null
      const value = JSON.parse(raw) as Partial<RememberedCall>
      if (typeof value.serverId !== 'string' || typeof value.roomId !== 'string') return null
      return {
        serverId: value.serverId,
        roomId: value.roomId,
        leftAt: typeof value.leftAt === 'number' ? value.leftAt : null,
      }
    } catch {
      return null
    }
  }
  const write = (call: RememberedCall) => {
    try {
      getStorage().setItem(KEY, JSON.stringify(call))
    } catch {
      // Not remembered; a reload just leaves the call.
    }
  }

  return {
    read,
    remember: ({ serverId, roomId }) => write({ serverId, roomId, leftAt: null }),
    markLeft(now) {
      const call = read()
      if (call) write({ ...call, leftAt: now })
    },
    forget() {
      try {
        getStorage().removeItem(KEY)
      } catch {
        // Nothing to clean.
      }
    },
  }
}

export { createCallMemory }
export type { CallMemory, StorageLike }
