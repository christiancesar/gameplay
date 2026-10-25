import { randomUUID } from 'node:crypto'

let sequence = 0

// Body for POST /api/auth/sign-up/email. The default registration key has a
// valid format but doesn't exist; pass one from issueRegistrationKey().
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
