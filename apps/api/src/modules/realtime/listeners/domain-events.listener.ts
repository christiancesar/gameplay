import { Injectable } from '@nestjs/common'
import { OnDomainEvent } from '../../../common/events/domain-event-bus'
import type { DomainEvents } from '../../../common/events/domain-events'
import { RealtimeEmitter } from '../providers/realtime-emitter/realtime-emitter.provider'
import { PresenceStore } from '../stores/presence.store'
import { ReleaseVoiceSeatsUseCase } from '../use-cases/release-voice-seats.use-case'

const REMOVED_REASON = { kick: 'kicked', leave: 'left' } as const

// Bridge from the domain events published by the REST use-cases to the
// sockets, clearing the voice seats that no longer make sense.
@Injectable()
export class DomainEventsListener {
  constructor(
    private readonly emitter: RealtimeEmitter,
    private readonly presence: PresenceStore,
    private readonly releaseSeats: ReleaseVoiceSeatsUseCase,
  ) {}

  @OnDomainEvent('server.updated')
  serverUpdated({ serverId }: DomainEvents['server.updated']) {
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('room.changed')
  async roomChanged({ serverId, deletedRoomId }: DomainEvents['room.changed']) {
    if (deletedRoomId) await this.releaseSeats.execute({ roomId: deletedRoomId })
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('membership.join-requested')
  joinRequested({ serverId }: DomainEvents['membership.join-requested']) {
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('membership.declined')
  declined({ serverId }: DomainEvents['membership.declined']) {
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('membership.role-changed')
  roleChanged({ serverId }: DomainEvents['membership.role-changed']) {
    this.emitter.serverChanged(serverId)
  }

  // The new member's presence was not in the snapshots the others got.
  @OnDomainEvent('membership.approved')
  async approved({ serverId, userId }: DomainEvents['membership.approved']) {
    this.emitter.serverChanged(serverId)
    if (await this.presence.isOnline(userId)) this.emitter.presenceUpdate([serverId], { userId, online: true })
  }

  @OnDomainEvent('membership.removed')
  async removed({ serverId, userId, reason }: DomainEvents['membership.removed']) {
    await this.releaseSeats.execute({ userId, serverId })
    this.emitter.serverRemoved([userId], { serverId, reason: REMOVED_REASON[reason] })
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('server.deleted')
  async serverDeleted({ serverId, memberIds }: DomainEvents['server.deleted']) {
    await this.releaseSeats.execute({ serverId })
    this.emitter.serverRemoved(memberIds, { serverId, reason: 'deleted' })
  }

  // Out of the voice room at once, without the reconnection wait.
  @OnDomainEvent('user.suspended')
  async suspended({ userId }: DomainEvents['user.suspended']) {
    await this.releaseSeats.execute({ userId })
    this.emitter.sessionRevoked(userId)
  }

  @OnDomainEvent('user.sessions-revoked')
  async sessionsRevoked({ userId }: DomainEvents['user.sessions-revoked']) {
    await this.releaseSeats.execute({ userId })
    this.emitter.sessionRevoked(userId)
  }

  // Only the sockets of that session close; the voice seat of a closed tab
  // frees itself after the reconnection wait.
  @OnDomainEvent('user.session-revoked')
  sessionRevoked({ sessionId }: DomainEvents['user.session-revoked']) {
    this.emitter.sessionEnded(sessionId)
  }

  @OnDomainEvent('notification.created')
  notificationCreated({ userId, notificationId, announcement }: DomainEvents['notification.created']) {
    this.emitter.notificationNew(userId, notificationId, announcement)
  }
}
