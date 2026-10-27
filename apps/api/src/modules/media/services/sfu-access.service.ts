import { Injectable } from '@nestjs/common'
import type { Seat } from '../../realtime/domain/seat'
import type { SfuSession } from '../../realtime/domain/sfu-session'
import { NotInRoomError } from '../../realtime/errors/realtime.errors'
import { RoomStateStore } from '../../realtime/stores/room-state.store'
import { SfuSessionStore } from '../../realtime/stores/sfu-session.store'
import { SfuSessionNotFoundError } from '../errors/media.errors'

// Only people in a voice room use the SFU, and only on their own sessions
// from the room they are in now.
@Injectable()
export class SfuAccessService {
  constructor(
    private readonly seats: RoomStateStore,
    private readonly sessions: SfuSessionStore,
  ) {}

  async seatOf(userId: string): Promise<Seat> {
    const seat = await this.seats.find(userId)
    if (!seat) throw new NotInRoomError()
    return seat
  }

  async ownSession(userId: string, sessionId: string): Promise<{ seat: Seat; session: SfuSession }> {
    const seat = await this.seatOf(userId)
    const session = await this.sessions.find(sessionId)
    if (session?.userId !== userId || session.roomId !== seat.roomId) throw new SfuSessionNotFoundError()
    return { seat, session }
  }
}
