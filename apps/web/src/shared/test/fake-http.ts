import { vi } from 'vitest'

/** Same call surface the services use on `http`; each call resolves to an Axios-like `{ data }`. */
const fakeHttp = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

export { fakeHttp }
