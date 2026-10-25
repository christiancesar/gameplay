import { Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import type { DomainEventName, DomainEvents } from './domain-events'

// Use-cases publish here after the database write. Listeners live in other
// modules (realtime gateway, notifications), so no REST module imports them.
@Injectable()
export class DomainEventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  // Resolves once every listener has run; a failing listener rejects it.
  async publish<K extends DomainEventName>(name: K, payload: DomainEvents[K]): Promise<void> {
    await this.emitter.emitAsync(name, payload)
  }
}

// Typed version of @OnEvent for domain events.
export function OnDomainEvent(name: DomainEventName): MethodDecorator {
  return OnEvent(name, { promisify: true, suppressErrors: false })
}
