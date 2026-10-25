import { Injectable } from '@nestjs/common'
import type { RoomLeft } from '@gameplay/shared'
import type { Seat } from '../domain/seat'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore } from '../stores/room-state.store'

// Which seats to clear, from a domain event.
type Target =
  // A deleted room.
  | { roomId: string }
  // A deleted server: no one is left to hear about its rooms.
  | { serverId: string }
  // A person out of a server (kicked or left), or out of every server
  // (suspended, sessions ended).
  | { userId: string; serverId?: string }

// Takes people out of voice rooms without them asking.
@Injectable()
export class ReleaseVoiceSeatsUseCase {
  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
  ) {}

  async execute(target: Target): Promise<void> {
    const reason: RoomLeft['reason'] = 'roomId' in target ? 'room-deleted' : 'removed'
    const announce = !('serverId' in target && !('userId' in target))
    const rooms = new Map<string, string>()

    for (const seat of await this.seatsOf(target)) {
      const removed = await this.store.remove(seat.userId)
      if (!removed) continue
      this.voice.released(removed, reason)
      rooms.set(removed.roomId, removed.serverId)
    }
    if (!announce) return
    for (const [roomId, serverId] of rooms) await this.voice.announce(serverId, roomId)
  }

  private async seatsOf(target: Target): Promise<Seat[]> {
    if ('roomId' in target) return this.store.listRoom(target.roomId)
    if ('userId' in target) {
      const seat = await this.store.find(target.userId)
      return seat && (!target.serverId || seat.serverId === target.serverId) ? [seat] : []
    }
    return this.store.listServer(target.serverId)
  }
}
