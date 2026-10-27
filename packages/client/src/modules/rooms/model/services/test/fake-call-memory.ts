import type { RememberedCall } from '../../rules/resume-call'
import type { CallMemory } from '../call-memory.service'

/** The remembered call in memory, for specs. */
class FakeCallMemory implements CallMemory {
  saved: RememberedCall | null = null

  read() {
    return this.saved
  }

  remember({ serverId, roomId }: { serverId: string; roomId: string }) {
    this.saved = { serverId, roomId, leftAt: null }
  }

  markLeft(now: number) {
    if (this.saved) this.saved = { ...this.saved, leftAt: now }
  }

  forget() {
    this.saved = null
  }
}

export { FakeCallMemory }
