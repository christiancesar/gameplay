import type { PresenceSnapshot, PresenceUpdate, RoomOccupancy, RoomParticipants } from '@gameplay/contracts'
import { create } from 'zustand'

type PresenceState = {
  /** Server the data belongs to; null until its snapshot arrives. */
  serverId: string | null
  onlineUserIds: string[]
  /** Who is in each voice room (rooms nobody is in are absent). */
  rooms: RoomOccupancy[]
  applySnapshot: (snapshot: PresenceSnapshot) => void
  applyUpdate: (update: PresenceUpdate) => void
  applyRoomParticipants: (event: RoomParticipants) => void
  reset: () => void
}

const initial = { serverId: null, onlineUserIds: [], rooms: [] }

const usePresenceStore = create<PresenceState>()((set) => ({
  ...initial,
  applySnapshot: ({ serverId, onlineUserIds, rooms }) => set({ serverId, onlineUserIds, rooms }),
  // Events of a server the screen is not showing (or before its snapshot) are ignored.
  applyUpdate: ({ serverId, userId, online }) =>
    set((state) => {
      if (state.serverId !== serverId) return state
      const others = state.onlineUserIds.filter((id) => id !== userId)
      return { onlineUserIds: online ? [...others, userId] : others }
    }),
  applyRoomParticipants: ({ serverId, roomId, participants }) =>
    set((state) => {
      if (state.serverId !== serverId) return state
      const others = state.rooms.filter((room) => room.roomId !== roomId)
      return { rooms: participants.length > 0 ? [...others, { roomId, participants }] : others }
    }),
  reset: () => set(initial),
}))

export { usePresenceStore }
