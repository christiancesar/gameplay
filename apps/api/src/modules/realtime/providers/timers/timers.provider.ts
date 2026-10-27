// Delayed jobs by key; scheduling a key again replaces the pending job. Tests
// use a fake that runs the jobs on demand.
export abstract class Timers {
  abstract schedule(key: string, delayMs: number, job: () => Promise<void>): void
  abstract cancel(key: string): void
}
