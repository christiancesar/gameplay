import { randomBytes } from 'node:crypto'

/** Prefix of everything one run creates (usernames, server names, ids), so the cleanup can find it. */
function createRunId(): string {
  return `e2e${randomBytes(3).toString('hex')}`
}

export { createRunId }
