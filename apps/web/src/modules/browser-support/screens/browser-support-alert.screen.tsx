import { BrowserSupportAlertView } from '@/modules/browser-support/views/browser-support-alert.view'
import { useBrowserSupportViewModel } from '@/modules/browser-support/view-models/use-browser-support.view-model'

/** Above the sign-in form. Renders nothing for a supported browser or after "Continue anyway". */
export function BrowserSupportAlertScreen() {
  const { status, onDismiss } = useBrowserSupportViewModel()
  return status ? <BrowserSupportAlertView status={status} onDismiss={onDismiss} /> : null
}
