import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { detectBrowser } from '@/modules/browser-support/model/rules/detect-browser'
import { getBrowserSupportStatus } from '@/modules/browser-support/model/rules/get-browser-support-status'
import { browserEnvironment } from '@/modules/browser-support/model/services/browser-environment.service'
import { dismissedNotices } from '@/modules/browser-support/model/services/dismissed-notices.service'
import { publicSettingsQueryOptions } from '@/modules/browser-support/model/services/public-settings.query'

/**
 * Browser alert above the sign-in form and in the Hub panel (F1, F4). Informs only.
 * Dismissing is remembered for the tab session, so it does not come back on the next page.
 */
function useBrowserSupportViewModel() {
  const { data: settings } = useQuery(publicSettingsQueryOptions)
  const [dismissed, setDismissed] = useState(() => dismissedNotices.isDismissed('browser'))
  const browser = useMemo(() => detectBrowser(browserEnvironment.readBrowser()), [])

  return {
    status: dismissed ? null : getBrowserSupportStatus(browser, settings?.minChromiumVersion),
    onDismiss: () => {
      dismissedNotices.dismiss('browser')
      setDismissed(true)
    },
  }
}

export { useBrowserSupportViewModel }
