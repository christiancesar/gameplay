import { useEffect } from 'react'

import { useConnectionStore } from '@/modules/realtime/view-models/stores/connection.store'

const RECOVERED_VISIBLE_MS = 2500

/** Banner state for F13: "reconnecting" while the socket is down, "back online" for a moment after. */
function useConnectionBannerViewModel() {
  const status = useConnectionStore((state) => state.status)
  const recovered = useConnectionStore((state) => state.recovered)

  useEffect(() => {
    if (!recovered) return
    const timer = setTimeout(() => useConnectionStore.getState().dismissRecovered(), RECOVERED_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [recovered])

  const bannerStatus = status === 'reconnecting' ? 'reconnecting' : recovered ? 'reconnected' : 'online'
  return { status: bannerStatus } as const
}

export { useConnectionBannerViewModel }
