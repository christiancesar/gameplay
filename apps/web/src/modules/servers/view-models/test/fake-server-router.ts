import { navigate } from '@/shared/test/fake-router'

/** Router module for the server screen: `useParams` answers the server the spec put on screen. */
const params = { serverId: 's1' }

/** What `useSearch` answers; specs assign what the route would parse from the URL. */
const search: { watch?: string } = {}

const fakeServerRouterModule = {
  useNavigate: () => navigate,
  useParams: () => params,
  useSearch: () => search,
}

export { fakeServerRouterModule, params, search }
