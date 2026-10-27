import { vi } from 'vitest'

/** The `authClient` calls the settings ViewModels and services make; each resolves to `{ data, error }`. */
const fakeAccountAuthClient = {
  updateUser: vi.fn(),
  changePassword: vi.fn(),
  getSession: vi.fn(),
}

export { fakeAccountAuthClient }
