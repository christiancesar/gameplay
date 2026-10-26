import { vi } from 'vitest'

/** Same call surface the setup uses on `authClient.twoFactor`; each call resolves to `{ data, error }`. */
const fakeTwoFactorClient = {
  twoFactor: { enable: vi.fn(), verifyTotp: vi.fn() },
  getSession: vi.fn(),
}

export { fakeTwoFactorClient }
