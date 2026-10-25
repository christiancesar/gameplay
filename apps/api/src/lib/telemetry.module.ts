import { Injectable, Module, type OnApplicationShutdown } from '@nestjs/common'
import { shutdownTelemetry } from './otel'

// Sends the last spans, metrics and logs when the app stops (SIGTERM).
@Injectable()
class TelemetryShutdown implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await shutdownTelemetry()
  }
}

@Module({ providers: [TelemetryShutdown] })
export class TelemetryModule {}
