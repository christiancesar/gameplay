import { navigate } from '@/shared/test/fake-router'

/** Router module for the server screen: `useParams` answers the server the spec put on screen. */
const params = { serverId: 's1' }

const fakeServerRouterModule = {
  useNavigate: () => navigate,
  useParams: () => params,
}

export { fakeServerRouterModule, params }
