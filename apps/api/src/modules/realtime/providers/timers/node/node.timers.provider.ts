import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common'
import { Timers } from '../timers.provider'

@Injectable()
export class NodeTimers extends Timers implements OnModuleDestroy {
  private readonly logger = new Logger(NodeTimers.name)
  private readonly pending = new Map<string, NodeJS.Timeout>()

  schedule(key: string, delayMs: number, job: () => Promise<void>) {
    this.cancel(key)
    const timer = setTimeout(() => {
      this.pending.delete(key)
      job().catch((error: unknown) => this.logger.error({ err: error, key }, 'A delayed job failed'))
    }, delayMs)
    // Never keeps the process alive.
    timer.unref()
    this.pending.set(key, timer)
  }

  cancel(key: string) {
    clearTimeout(this.pending.get(key))
    this.pending.delete(key)
  }

  onModuleDestroy() {
    for (const timer of this.pending.values()) clearTimeout(timer)
    this.pending.clear()
  }
}
