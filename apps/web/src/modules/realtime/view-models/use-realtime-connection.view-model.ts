import { useEffect } from 'react'

import { realtime } from '@/modules/realtime/model/services/realtime.service'

import { useConnectionStore } from './stores/connection.store'
import { useRealtimeEventsViewModel } from './use-realtime-events.view-model'

/**
 * Owns the socket for the logged-in session: connects when the `_authed` layout mounts (the cookie
 * authenticates the handshake) and closes it when the layout unmounts, which also covers sign-out.
 */
function useRealtimeConnectionViewModel() {
  useRealtimeEventsViewModel()

  useEffect(() => {
    const { setStatus, reset } = useConnectionStore.getState()
    const stop = realtime.onStatusChange(setStatus)
    realtime.connect()
    return () => {
      stop()
      realtime.disconnect()
      reset()
    }
  }, [])
}

export { useRealtimeConnectionViewModel }
