import { vi } from 'vitest'

const navigate = vi.fn()

const fakeRouterModule = {
  useNavigate: () => navigate,
}

export { fakeRouterModule, navigate }
