import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { telemetry } from '@/shared/lib/telemetry/current-telemetry'

/** Tells the error reporter who is signed in (id only), and forgets them when the session ends. */
function useMonitoringUserViewModel() {
  const { data } = useQuery(sessionQueryOptions)
  const userId = data?.user?.id

  useEffect(() => {
    if (userId) telemetry.setUser({ id: userId })
    else telemetry.clearUser()
  }, [userId])
}

export { useMonitoringUserViewModel }
