import { create } from 'zustand'

import type { ConnectionStatus } from '@/modules/realtime/model/services/realtime.service'

type ConnectionState = {
  status: ConnectionStatus
  /** True right after a reconnect, so the banner can say "back online" for a moment. */
  recovered: boolean
  setStatus: (status: ConnectionStatus) => void
  dismissRecovered: () => void
  reset: () => void
}

const useConnectionStore = create<ConnectionState>()((set) => ({
  status: 'disconnected',
  recovered: false,
  setStatus: (status) =>
    set((state) => ({ status, recovered: state.status === 'reconnecting' && status === 'connected' })),
  dismissRecovered: () => set({ recovered: false }),
  reset: () => set({ status: 'disconnected', recovered: false }),
}))

export { useConnectionStore }
