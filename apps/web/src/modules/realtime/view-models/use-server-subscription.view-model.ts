import { useEffect } from 'react'

import { realtime } from '@/modules/realtime/model/services/realtime.service'

import { usePresenceStore } from './stores/presence.store'

/**
 * Follows one server while its screen is open: asks the API for its presence (`server:subscribe`),
 * asks again after every reconnect (the API forgets the subscription with the old socket) and keeps
 * the presence store fed. The contract has no unsubscribe event: the API stops the previous
 * subscription when another one arrives or the socket closes, so leaving only resets the store.
 */
function useServerSubscriptionViewModel(serverId: string) {
  useEffect(() => {
    const { applySnapshot, applyUpdate, applyRoomParticipants, reset } = usePresenceStore.getState()
    // A snapshot of a server we left can still be in flight.
    const ifCurrent =
      <T extends { serverId: string }>(apply: (payload: T) => void) =>
      (payload: T) => {
        if (payload.serverId === serverId) apply(payload)
      }

    const subscribe = () => {
      // A refused subscription (membership lost) is handled by `server:removed`.
      realtime.subscribeToServer(serverId).catch(() => undefined)
    }

    const stops = [
      realtime.on('presence:snapshot', ifCurrent(applySnapshot)),
      realtime.on('presence:update', ifCurrent(applyUpdate)),
      realtime.on('room:participants', ifCurrent(applyRoomParticipants)),
      // Covers the first connection (socket still connecting) and every reconnect.
      realtime.onStatusChange((status) => {
        if (status === 'connected') subscribe()
      }),
    ]
    if (realtime.isConnected()) subscribe()

    return () => {
      stops.forEach((stop) => stop())
      reset()
    }
  }, [serverId])

  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds)
  const rooms = usePresenceStore((state) => state.rooms)
  return { onlineUserIds, rooms }
}

export { useServerSubscriptionViewModel }
