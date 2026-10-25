import { Injectable } from '@nestjs/common'
import type { SignalSend, StreamQualityLevel } from '@gameplay/shared'
import type { Seat } from '../domain/seat'
import { NotStreamingError, PeerNotInRoomError } from '../errors/realtime.errors'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { VoiceRoomsService } from '../services/voice-rooms.service'
import { RoomStateStore } from '../stores/room-state.store'

type Message =
  | { type: 'signal'; to: string; kind: SignalSend['kind']; data: unknown }
  | { type: 'watch'; streamerId: string }
  | { type: 'unwatch'; streamerId: string }
  | { type: 'quality'; streamerId: string; level: StreamQualityLevel }

type Input = { userId: string; socketId: string; message: Message }

// Messages from one person to another in the same voice room: WebRTC
// signaling, and a viewer asking the streamer to start, stop or adjust the
// screen it sends them. Goes only to the tab holding the other seat.
@Injectable()
export class RelayToPeerUseCase {
  constructor(
    private readonly store: RoomStateStore,
    private readonly voice: VoiceRoomsService,
    private readonly emitter: RealtimeEmitter,
  ) {}

  async execute({ userId, socketId, message }: Input): Promise<void> {
    const seat = await this.voice.seatOf(userId, socketId)
    const peer = await this.peerOf(seat, message.type === 'signal' ? message.to : message.streamerId)

    switch (message.type) {
      case 'signal':
        return this.emitter.signal(peer.socketId, { from: userId, kind: message.kind, data: message.data })
      case 'watch':
        if (!peer.streaming) throw new NotStreamingError()
        return this.emitter.watchRequested(peer.socketId, userId)
      // Allowed after the stream ended, so the streamer drops the connection.
      case 'unwatch':
        return this.emitter.watchStopped(peer.socketId, userId)
      case 'quality':
        if (!peer.streaming) throw new NotStreamingError()
        return this.emitter.qualityRequested(peer.socketId, userId, message.level)
    }
  }

  // Connected, in the same room, and not oneself.
  private async peerOf(seat: Seat, peerId: string): Promise<Seat & { socketId: string }> {
    const peer = peerId === seat.userId ? null : await this.store.find(peerId)
    if (!peer?.socketId || peer.roomId !== seat.roomId) throw new PeerNotInRoomError()
    return { ...peer, socketId: peer.socketId }
  }
}
