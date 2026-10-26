import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { deviceReporter } from '@/modules/hardware/model/services/device-reporter.service'
import { displays } from '@/modules/hardware/model/services/displays.service'
import { hardwareKeys } from '@/modules/hardware/model/services/hardware.keys'

/**
 * Sends this device's hardware once per signed-in user, as soon as the logged layout mounts (F11).
 * Silent: a failure here must never get in the way. The settings section can collect again on demand.
 * The monitors are only read when their permission was granted before; this never prompts.
 */
function useAutoReportHardwareViewModel() {
  const queryClient = useQueryClient()
  const { data: session } = useQuery(sessionQueryOptions)
  const reportedFor = useRef<string | undefined>(undefined)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId || reportedFor.current === userId) return
    reportedFor.current = userId
    void (async () => {
      try {
        const withDisplays = (await displays.permission()) === 'granted'
        await deviceReporter.report({ withDisplays })
        await queryClient.invalidateQueries({ queryKey: hardwareKeys.devices() })
      } catch {
        // Reporting is best effort.
      }
    })()
  }, [userId, queryClient])
}

export { useAutoReportHardwareViewModel }
