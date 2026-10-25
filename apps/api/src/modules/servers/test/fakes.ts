import type { EventEmitter2 } from '@nestjs/event-emitter'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import type { DomainEventName, DomainEvents } from '../../../common/events/domain-events'
import { InMemoryPlatformSettingsRepository } from '../../limits/repositories/in-memory/in-memory-platform-settings.repository'
import { InMemoryServerLimitsRepository } from '../../limits/repositories/in-memory/in-memory-server-limits.repository'
import { InMemoryUserLimitsRepository } from '../../limits/repositories/in-memory/in-memory-user-limits.repository'
import { EffectiveLimitsService } from '../../limits/services/effective-limits.service'
import { InMemoryStorageProvider } from '../../storage/drivers/in-memory-storage.provider'
import { ImageProcessor } from '../../storage/images/image-processor'
import { InMemoryRoomsRepository } from '../repositories/in-memory/in-memory-rooms.repository'
import { InMemoryServersRepository } from '../repositories/in-memory/in-memory-servers.repository'
import { ServerAccessService } from '../services/server-access.service'
import { ServerViewsService } from '../services/server-views.service'

// Keeps what was published, in order.
export class FakeEventBus extends DomainEventBus {
  readonly published: { name: DomainEventName; payload: unknown }[] = []

  constructor() {
    super(null as unknown as EventEmitter2)
  }

  override async publish<K extends DomainEventName>(name: K, payload: DomainEvents[K]): Promise<void> {
    this.published.push({ name, payload })
  }
}

// Everything a servers use-case needs, in memory.
export function makeServersContext() {
  const rooms = new InMemoryRoomsRepository()
  const servers = new InMemoryServersRepository(rooms)
  const settings = new InMemoryPlatformSettingsRepository()
  const userLimits = new InMemoryUserLimitsRepository()
  const serverLimits = new InMemoryServerLimitsRepository()
  const limits = new EffectiveLimitsService(settings, userLimits, serverLimits)
  const storage = new InMemoryStorageProvider()
  const events = new FakeEventBus()
  return {
    rooms,
    servers,
    settings,
    userLimits,
    serverLimits,
    limits,
    storage,
    events,
    images: new ImageProcessor(),
    access: new ServerAccessService(servers),
    views: new ServerViewsService(servers, rooms, limits, storage),
  }
}
