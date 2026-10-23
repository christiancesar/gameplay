import { RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DeviceHardwareView, type DeviceHardware, type DisplaysPermission } from '@/modules/hardware/views/device-hardware.view'
import { Button } from '@/shared/ui/button'
import { formatRelativeTime } from '@/shared/ui/relative-time'

type HardwareSectionViewProps = {
  hardware: DeviceHardware
  displaysPermission: DisplaysPermission
  lastSentAt?: string
  isCollecting: boolean
  onRefresh: () => void
  onAllowDisplays: () => void
}

function HardwareSectionView({ hardware, displaysPermission, lastSentAt, isCollecting, onRefresh, onAllowDisplays }: HardwareSectionViewProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">{t('hardware.description')}</p>
          {lastSentAt && <p className="text-muted-foreground text-xs">{t('hardware.lastSent', { date: formatRelativeTime(lastSentAt, i18n.language) })}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isCollecting} aria-busy={isCollecting}>
          <RefreshCwIcon data-icon="inline-start" className={isCollecting ? 'animate-spin' : undefined} aria-hidden />
          {t('hardware.refresh')}
        </Button>
      </div>
      <DeviceHardwareView hardware={hardware} displaysPermission={displaysPermission} onAllowDisplays={onAllowDisplays} />
      <p className="text-muted-foreground text-xs">{t('hardware.limits')}</p>
    </div>
  )
}

export { HardwareSectionView }
export type { HardwareSectionViewProps }
