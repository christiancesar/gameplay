import { Injectable } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { Test } from '@nestjs/testing'
import { DomainEventBus, OnDomainEvent } from './domain-event-bus'

declare module './domain-events' {
  interface DomainEvents {
    'test.happened': { id: string }
  }
}

@Injectable()
class TestListener {
  received: { id: string }[] = []

  @OnDomainEvent('test.happened')
  handle(payload: { id: string }) {
    this.received.push(payload)
  }
}

describe('DomainEventBus', () => {
  it('delivers the payload to the listeners before resolving', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [DomainEventBus, TestListener],
    }).compile()
    await moduleRef.init()

    await moduleRef.get(DomainEventBus).publish('test.happened', { id: '42' })

    expect(moduleRef.get(TestListener).received).toEqual([{ id: '42' }])
    await moduleRef.close()
  })
})
