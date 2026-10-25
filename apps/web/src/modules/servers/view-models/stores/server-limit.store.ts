import { create } from 'zustand'

type ServerLimitState = {
  /** Owned-server count at which the API answered SERVER_LIMIT_REACHED. */
  refusedAtOwnedCount: number | null
  markRefused: (ownedCount: number) => void
}

/** What the Hub learned about the global server limit, which regular users cannot read. */
const useServerLimitStore = create<ServerLimitState>((set) => ({
  refusedAtOwnedCount: null,
  markRefused: (ownedCount) => set({ refusedAtOwnedCount: ownedCount }),
}))

export { useServerLimitStore }
