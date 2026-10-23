import { MonitorIcon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'

type HardwarePermissionBannerViewProps = {
  onAllow: () => void
  onDismiss: () => void
}

/** Aviso no Hub pedindo a permissão de ver os monitores (Window Management API). */
function HardwarePermissionBannerView({ onAllow, onDismiss }: HardwarePermissionBannerViewProps) {
  const { t } = useTranslation()

  return (
    <section aria-label={t('hardware.banner.title')} className="bg-card text-card-foreground flex w-full items-start gap-3 rounded-md border p-3">
      <MonitorIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <p className="text-sm font-medium">{t('hardware.banner.title')}</p>
          <p className="text-muted-foreground text-xs leading-snug">{t('hardware.banner.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onAllow}>
            {t('hardware.allow')}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            {t('hardware.banner.notNow')}
          </Button>
        </div>
      </div>
      <IconButton label={t('common.close')} icon={<XIcon />} size="icon-sm" onClick={onDismiss} />
    </section>
  )
}

export { HardwarePermissionBannerView }
export type { HardwarePermissionBannerViewProps }
