import { randomUUID } from 'node:crypto'

let sequence = 0

// Body for POST /api/auth/sign-up/email. The registration key only needs a
// valid format until BE-05 checks it against the database.
export function makeSignUp(overrides: Partial<Record<string, string>> = {}) {
  sequence += 1
  const username = `user_${sequence}_${randomUUID().slice(0, 6)}`
  return {
    email: `${username}@example.com`,
    password: 'correct-horse-battery',
    username,
    registrationKey: 'ABC234',
    ...overrides,
  }
}
