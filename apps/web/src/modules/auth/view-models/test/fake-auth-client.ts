import { vi } from 'vitest'

/** Same call surface the ViewModels use on `authClient`; each call resolves to `{ data, error }`. */
const fakeAuthClient = {
  signIn: { email: vi.fn(), username: vi.fn() },
  signUp: { email: vi.fn() },
  getSession: vi.fn(),
  signOut: vi.fn(),
  twoFactor: { verifyTotp: vi.fn(), verifyBackupCode: vi.fn() },
}

export { fakeAuthClient }
