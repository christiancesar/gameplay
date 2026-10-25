import { Global, Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { AllExceptionsFilter } from './errors/all-exceptions.filter'
import { DomainEventBus } from './events/domain-event-bus'

// Cross-cutting pieces every module relies on: request validation with zod,
// response serialization, the error contract, rate limit and the event bus.
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // Default for every route; login and sign-up get stricter limits.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    DomainEventBus,
  ],
  exports: [DomainEventBus],
})
export class CommonModule {}
