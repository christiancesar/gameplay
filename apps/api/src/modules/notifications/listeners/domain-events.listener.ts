import { Injectable } from '@nestjs/common'
import { OnDomainEvent } from '../../../common/events/domain-event-bus'
import type { DomainEvents } from '../../../common/events/domain-events'
import { noticesFor } from '../domain/notices-for'
import { NotifyUseCase } from '../use-cases/notify.use-case'

// Turns domain events into Hub notifications; who gets what is in noticesFor.
@Injectable()
export class NotificationsListener {
  constructor(private readonly notify: NotifyUseCase) {}

  @OnDomainEvent('membership.join-requested')
  joinRequested(event: DomainEvents['membership.join-requested']) {
    return this.send(noticesFor['membership.join-requested'](event))
  }

  @OnDomainEvent('membership.approved')
  approved(event: DomainEvents['membership.approved']) {
    return this.send(noticesFor['membership.approved'](event))
  }

  @OnDomainEvent('membership.removed')
  removed(event: DomainEvents['membership.removed']) {
    return this.send(noticesFor['membership.removed'](event))
  }

  @OnDomainEvent('membership.role-changed')
  roleChanged(event: DomainEvents['membership.role-changed']) {
    return this.send(noticesFor['membership.role-changed'](event))
  }

  @OnDomainEvent('server.deleted')
  serverDeleted(event: DomainEvents['server.deleted']) {
    return this.send(noticesFor['server.deleted'](event))
  }

  @OnDomainEvent('server-invite.expired-on-sign-up')
  inviteExpired(event: DomainEvents['server-invite.expired-on-sign-up']) {
    return this.send(noticesFor['server-invite.expired-on-sign-up'](event))
  }

  private async send(notice: ReturnType<(typeof noticesFor)[keyof typeof noticesFor]>) {
    if (notice) await this.notify.execute(notice)
  }
}
