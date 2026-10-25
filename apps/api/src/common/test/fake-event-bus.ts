import type { EventEmitter2 } from '@nestjs/event-emitter'
import { DomainEventBus } from '../events/domain-event-bus'
import type { DomainEventName, DomainEvents } from '../events/domain-events'

// Keeps what was published, in order, without running any listener.
export class FakeEventBus extends DomainEventBus {
  readonly published: { name: DomainEventName; payload: unknown }[] = []

  constructor() {
    super(null as unknown as EventEmitter2)
  }

  override async publish<K extends DomainEventName>(name: K, payload: DomainEvents[K]): Promise<void> {
    this.published.push({ name, payload })
  }
}
