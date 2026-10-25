import { create } from 'zustand'

import type { ServerLimitOverride } from '@/modules/admin/model/mappers/admin-server.mapper'

type LimitOverridesState = {
  users: Record<string, number | undefined>
  servers: Record<string, ServerLimitOverride | undefined>
  setUserOverride: (userId: string, value: number | undefined) => void
  setServerOverride: (serverId: string, override: ServerLimitOverride) => void
}

/**
 * Overrides the admin set from this panel. The API accepts them (PUT) but does not return them,
 * so the panel remembers what it saved to show "custom" instead of "default" until the page reloads.
 */
const useLimitOverridesStore = create<LimitOverridesState>((set) => ({
  users: {},
  servers: {},
  setUserOverride: (userId, value) => set((state) => ({ users: { ...state.users, [userId]: value } })),
  setServerOverride: (serverId, override) => set((state) => ({ servers: { ...state.servers, [serverId]: override } })),
}))

export { useLimitOverridesStore }
