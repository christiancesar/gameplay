import { Injectable } from '@nestjs/common'
import { OnDomainEvent } from '../../../common/events/domain-event-bus'
import type { DomainEvents } from '../../../common/events/domain-events'
import { RealtimeEmitter } from '../providers/realtime-emitter'
import { PresenceStore } from '../stores/presence.store'

const REMOVED_REASON = { kick: 'kicked', leave: 'left' } as const

// Bridge from the domain events published by the REST use-cases to the
// sockets. The deleted room in room.changed is handled with voice rooms (BE-12).
@Injectable()
export class DomainEventsListener {
  constructor(
    private readonly emitter: RealtimeEmitter,
    private readonly presence: PresenceStore,
  ) {}

  @OnDomainEvent('server.updated')
  serverUpdated({ serverId }: DomainEvents['server.updated']) {
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('room.changed')
  roomChanged({ serverId }: DomainEvents['room.changed']) {
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
  removed({ serverId, userId, reason }: DomainEvents['membership.removed']) {
    this.emitter.serverRemoved([userId], { serverId, reason: REMOVED_REASON[reason] })
    this.emitter.serverChanged(serverId)
  }

  @OnDomainEvent('server.deleted')
  serverDeleted({ serverId, memberIds }: DomainEvents['server.deleted']) {
    this.emitter.serverRemoved(memberIds, { serverId, reason: 'deleted' })
  }

  @OnDomainEvent('user.suspended')
  suspended({ userId }: DomainEvents['user.suspended']) {
    this.emitter.sessionRevoked(userId)
  }

  @OnDomainEvent('user.sessions-revoked')
  sessionsRevoked({ userId }: DomainEvents['user.sessions-revoked']) {
    this.emitter.sessionRevoked(userId)
  }
}
