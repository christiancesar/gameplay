import { vi } from 'vitest'

const navigate = vi.fn()
/** Path params returned by the mocked `useParams`. */
const routerParams = { current: { code: 'JH34SD32' } }

const fakeRouterModule = {
  useNavigate: () => navigate,
  useParams: () => routerParams.current,
}

export { fakeRouterModule, navigate, routerParams }
