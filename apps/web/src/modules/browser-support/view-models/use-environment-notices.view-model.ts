import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { deviceReporter } from '@/modules/hardware/model/services/device-reporter.service'
import { displays, type DisplaysPermission } from '@/modules/hardware/model/services/displays.service'
import { hardwareKeys } from '@/modules/hardware/model/services/hardware.keys'
import { isAccelerationOff } from '@/modules/browser-support/model/rules/is-acceleration-off'
import { isVpnDetected } from '@/modules/browser-support/model/rules/is-vpn-detected'
import { browserEnvironment } from '@/modules/browser-support/model/services/browser-environment.service'
import { dismissedNotices, type NoticeKey } from '@/modules/browser-support/model/services/dismissed-notices.service'
import { publicIpsQueryOptions } from '@/modules/browser-support/model/services/public-ips.query'
import { useBrowserSupportViewModel } from '@/modules/browser-support/view-models/use-browser-support.view-model'
import type { HubNotification } from '@/modules/notifications/model/entities/hub-notification'
import { iceConfigQueryOptions } from '@/shared/media/ice.query'

const NOTICE_IDS = {
  browser: 'env:browser',
  vpn: 'env:vpn',
  acceleration: 'env:acceleration',
  monitors: 'env:monitors',
} as const satisfies Record<NoticeKey, string>

const KEY_BY_ID = Object.fromEntries(Object.entries(NOTICE_IDS).map(([key, id]) => [id, key])) as Record<
  string,
  NoticeKey
>

/**
 * The environment notices of the Hub panel: browser, VPN or proxy, graphics acceleration and the
 * monitors permission. They only inform; each can be dismissed for the tab session.
 */
function useEnvironmentNoticesViewModel() {
  const queryClient = useQueryClient()
  const browser = useBrowserSupportViewModel()
  const [dismissed, setDismissed] = useState<ReadonlySet<NoticeKey>>(
    () => new Set((Object.keys(NOTICE_IDS) as NoticeKey[]).filter((key) => dismissedNotices.isDismissed(key))),
  )
  const [accelerationOff] = useState(() => isAccelerationOff(browserEnvironment.readGpu()))
  const [monitorsPermission, setMonitorsPermission] = useState<DisplaysPermission>('unsupported')

  useEffect(() => {
    void displays.permission().then(setMonitorsPermission)
  }, [])

  const { data: ice } = useQuery(iceConfigQueryOptions)
  const vpnWanted = !dismissed.has('vpn')
  const { data: publicIps } = useQuery(publicIpsQueryOptions(vpnWanted ? ice?.iceServers : undefined))
  const vpn = publicIps !== undefined && ice !== undefined && isVpnDetected(publicIps, ice.requestIp)

  const dismissKey = (key: NoticeKey) => {
    dismissedNotices.dismiss(key)
    setDismissed((current) => new Set(current).add(key))
  }

  const notices: HubNotification[] = []
  if (browser.status) {
    notices.push(
      browser.status.type === 'unsupported'
        ? { id: NOTICE_IDS.browser, type: 'browserUnsupported', browser: browser.status.browser }
        : {
            id: NOTICE_IDS.browser,
            type: 'browserOutdated',
            browser: browser.status.browser,
            minVersion: browser.status.minVersion,
          },
    )
  }
  if (vpn && vpnWanted) notices.push({ id: NOTICE_IDS.vpn, type: 'vpn' })
  if (accelerationOff && !dismissed.has('acceleration')) {
    notices.push({ id: NOTICE_IDS.acceleration, type: 'accelerationOff' })
  }
  if (monitorsPermission === 'prompt' && !dismissed.has('monitors')) {
    notices.push({ id: NOTICE_IDS.monitors, type: 'monitorsPermission' })
  }

  return {
    notices,
    isEnvironmentNotice: (id: string) => id in KEY_BY_ID,
    dismiss: (id: string) => {
      const key = KEY_BY_ID[id]
      if (key === 'browser') browser.onDismiss()
      if (key) dismissKey(key)
    },
    dismissAll: () => {
      for (const notice of notices) {
        const key = KEY_BY_ID[notice.id]
        if (key === 'browser') browser.onDismiss()
        if (key) dismissKey(key)
      }
    },
    /** Asks for the monitors permission and, when granted, sends the hardware again with them. */
    allowMonitors: async () => {
      const result = await displays.request()
      setMonitorsPermission(result)
      if (result !== 'granted') return
      try {
        await deviceReporter.report({ withDisplays: true })
        await queryClient.invalidateQueries({ queryKey: hardwareKeys.devices() })
      } catch {
        // Best effort, like the automatic report.
      }
    },
  }
}

export { useEnvironmentNoticesViewModel }
