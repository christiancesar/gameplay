import { Injectable } from '@nestjs/common'
import { OnDomainEvent } from '../../../common/events/domain-event-bus'
import type { DomainEvents } from '../../../common/events/domain-events'
import { GetIceConfigUseCase } from '../use-cases/get-ice-config.use-case'

// The platform admin turned TURN off: the credentials of the people it cut
// stop working at once, instead of lasting until their TTL.
@Injectable()
export class TurnRevocationListener {
  constructor(private readonly getIceConfig: GetIceConfigUseCase) {}

  @OnDomainEvent('media.changed')
  async mediaChanged({ disabled, turnCutUserIds }: DomainEvents['media.changed']): Promise<void> {
    if (disabled.includes('turn')) await this.getIceConfig.revokeFor(turnCutUserIds)
  }
}
