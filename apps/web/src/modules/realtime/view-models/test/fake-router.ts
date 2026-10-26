import { vi } from 'vitest'

const navigate = vi.fn()
/** Where the app "is": specs assign the pathname the fake router reports. */
const location = { pathname: '/' }

const fakeRouterModule = {
  useNavigate: () => navigate,
  useRouter: () => ({ state: { location } }),
}

export { fakeRouterModule, location, navigate }
