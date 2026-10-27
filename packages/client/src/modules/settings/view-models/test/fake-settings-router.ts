import { vi } from 'vitest'

const navigate = vi.fn()
const search: { settings?: string } = {}

/** `useNavigate` and `useSearch` for the `?settings=` ViewModel. `search` is mutable so specs can open the modal. */
const fakeSettingsRouterModule = {
  useNavigate: () => navigate,
  useSearch: () => search,
}

export { fakeSettingsRouterModule, navigate, search }
