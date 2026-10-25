import { vi } from 'vitest'

const navigate = vi.fn()
/** Search params returned by the mocked `useSearch`; specs assign what the route would parse. */
const routerSearch: { current: Record<string, string | undefined> } = { current: {} }

const fakeRouterModule = {
  useNavigate: () => navigate,
  useSearch: () => routerSearch.current,
}

export { fakeRouterModule, navigate, routerSearch }
