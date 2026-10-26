import { vi } from 'vitest'

import { navigate } from '@/shared/test/fake-router'

import type { ServerSettingsSection } from '@/modules/servers/model/server.search'

/** What the route would answer: the server in the path and the `serverSettings` search param. */
const route: { serverId: string; section: ServerSettingsSection | undefined } = { serverId: 's1', section: 'general' }

/** Records the last `search` updater result so specs can assert on the URL change. */
const searchCalls = vi.fn()

const fakeServerSettingsRouterModule = {
  useNavigate: () => (options: { search?: (prev: object) => object }) => {
    if (options.search) searchCalls(options.search({ watch: 'u9' }))
    return navigate(options)
  },
  useParams: () => ({ serverId: route.serverId }),
  useSearch: () => ({ serverSettings: route.section }),
}

export { fakeServerSettingsRouterModule, route, searchCalls }
