import { Injectable } from '@nestjs/common'
import { OnDomainEvent } from '../../../common/events/domain-event-bus'
import type { DomainEvents } from '../../../common/events/domain-events'
import { SfuBudgetService } from '../services/sfu-budget.service'

// Adds what viewers report receiving from the SFU to this month's traffic.
@Injectable()
export class SfuUsageListener {
  constructor(private readonly budget: SfuBudgetService) {}

  @OnDomainEvent('media.usage-reported')
  async usageReported({ bytes }: DomainEvents['media.usage-reported']): Promise<void> {
    await this.budget.record(bytes)
  }
}
