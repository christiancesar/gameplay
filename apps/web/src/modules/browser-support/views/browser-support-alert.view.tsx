import { ExternalLinkIcon, TriangleAlertIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

/** Detectado pelo ViewModel (User-Agent Client Hints, com fallback no user agent). */
type BrowserSupportStatus =
  | { type: 'unsupported'; browser: { name: string; version: string } }
  | { type: 'outdated'; browser: { name: string; version: string }; minVersion: number }

type BrowserSupportAlertViewProps = {
  status: BrowserSupportStatus
  onDismiss: () => void
}

const RECOMMENDED_BROWSERS = [
  { name: 'Google Chrome', url: 'https://www.google.com/chrome/' },
  { name: 'Microsoft Edge', url: 'https://www.microsoft.com/edge' },
  { name: 'Brave', url: 'https://brave.com/download/' },
  { name: 'Opera', url: 'https://www.opera.com/download' },
  { name: 'Vivaldi', url: 'https://vivaldi.com/download/' },
] as const

function BrowserSupportAlertView({ status, onDismiss }: BrowserSupportAlertViewProps) {
  const { t } = useTranslation()
  const { browser } = status

  return (
    <Alert className="border-amber-500/40 text-left">
      <TriangleAlertIcon className="text-amber-500" />
      <AlertTitle>
        {status.type === 'unsupported'
          ? t('browserSupport.unsupportedTitle', { browser: browser.name })
          : t('browserSupport.outdatedTitle', { browser: browser.name })}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2 [&_a]:no-underline">
        {status.type === 'unsupported' ? (
          <>
            <span className="block">{t('browserSupport.unsupportedDescription')}</span>
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground block text-xs font-medium">{t('browserSupport.recommended')}</span>
              <ul className="flex flex-wrap gap-1.5">
                {RECOMMENDED_BROWSERS.map((item) => (
                  <li key={item.name}>
                    <Button asChild variant="outline" size="xs">
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.name}
                        <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <span className="block">
              {t('browserSupport.outdatedDescription', { version: browser.version, min: status.minVersion })}
            </span>
            <span className="block">{t('browserSupport.howToUpdate')}</span>
          </>
        )}
        <Button variant="ghost" size="sm" className="-ml-2 self-start" onClick={onDismiss}>
          {t('browserSupport.continueAnyway')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export { BrowserSupportAlertView, RECOMMENDED_BROWSERS }
export type { BrowserSupportAlertViewProps, BrowserSupportStatus }
