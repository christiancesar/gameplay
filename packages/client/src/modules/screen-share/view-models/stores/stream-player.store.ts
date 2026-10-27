import { create } from 'zustand'

/** How the stream player is shown. Client state only; nothing is kept after the page closes. */
type StreamPlayerState = {
  expanded: boolean
  landscapeOptOut: boolean
}

const idlePlayer: StreamPlayerState = { expanded: false, landscapeOptOut: false }

const useStreamPlayerStore = create<StreamPlayerState>()(() => ({ ...idlePlayer }))

export { idlePlayer, useStreamPlayerStore }
export type { StreamPlayerState }
