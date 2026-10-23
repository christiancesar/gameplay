import { useTranslation } from 'react-i18next'

import { DeviceHardwareView } from '@/modules/hardware/views/device-hardware.view'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

import type { AdminDeviceItem } from './hardware-tab.view'

type DeviceHardwareDialogViewProps = {
  open: boolean
  userName: string
  /** Dispositivos do usuário; com mais de um, aparece um seletor. */
  devices: readonly AdminDeviceItem[]
  currentDeviceId?: string
  onDeviceChange: (deviceId: string) => void
  onOpenChange: (open: boolean) => void
}

function DeviceHardwareDialogView({ open, userName, devices, currentDeviceId, onDeviceChange, onOpenChange }: DeviceHardwareDialogViewProps) {
  const { t, i18n } = useTranslation()
  const device = devices.find((item) => item.id === currentDeviceId) ?? devices[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('admin.hardware.deviceTitle', { name: userName })}</DialogTitle>
          {device && (
            <DialogDescription>
              {device.label} · {t('admin.hardware.lastSeen')} {formatRelativeTime(device.lastSeenAt, i18n.language)}
            </DialogDescription>
          )}
        </DialogHeader>
        {devices.length > 1 && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={device?.id}
            onValueChange={(value) => value && onDeviceChange(value)}
            aria-label={t('admin.hardware.devices')}
            className="flex-wrap"
          >
            {devices.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} className="px-3 text-xs">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        {device ? (
          <ScrollArea type="hover" className="-mr-3 h-[min(30rem,calc(100dvh-14rem))] pr-3">
            <DeviceHardwareView hardware={device.hardware} displaysPermission="granted" />
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground text-sm">{t('admin.hardware.noDevices')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { DeviceHardwareDialogView }
export type { DeviceHardwareDialogViewProps }
