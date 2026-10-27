import { Timers } from '../providers/timers/timers.provider'

// Jobs wait until the test runs them.
export class FakeTimers extends Timers {
  readonly pending = new Map<string, () => Promise<void>>()

  schedule(key: string, _delayMs: number, job: () => Promise<void>) {
    this.pending.set(key, job)
  }

  cancel(key: string) {
    this.pending.delete(key)
  }

  async runAll() {
    const jobs = [...this.pending.values()]
    this.pending.clear()
    for (const job of jobs) await job()
  }
}
