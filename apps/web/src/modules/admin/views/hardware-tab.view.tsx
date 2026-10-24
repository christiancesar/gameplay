import { cn } from 'cn'
import { useTranslation } from 'react-i18next'

import type { DeviceHardware } from '@/modules/hardware/views/device-hardware.view'
import { Badge } from '@/shared/ui/badge'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { UserAvatar } from '@/shared/ui/user-avatar'

type AdminDeviceItem = {
  id: string
  user: { id: string; name: string; avatarUrl?: string }
  /** Resumo pronto para exibir, ex.: "Windows 11 · Chrome 141". */
  label: string
  lastSeenAt: string
  hardware: DeviceHardware
}

/** Calculado pelo ViewModel a partir de todos os dispositivos. */
type HardwareSummary = {
  devices: number
  minCores?: number
  minMemoryGb?: number
  accelerationPercent: number
  h264HardwarePercent: number
}

type HardwareTabViewProps = {
  summary: HardwareSummary
  devices: readonly AdminDeviceItem[]
  onOpenDevice: (deviceId: string) => void
}

function HardwareTabView({ summary, devices, onOpenDevice }: HardwareTabViewProps) {
  const { t, i18n } = useTranslation()

  const cards = [
    { label: t('admin.hardware.devices'), value: String(summary.devices) },
    { label: t('admin.hardware.minCores'), value: summary.minCores !== undefined ? String(summary.minCores) : '–' },
    {
      label: t('admin.hardware.minMemory'),
      value: summary.minMemoryGb !== undefined ? `${summary.minMemoryGb} GB` : '–',
    },
    { label: t('admin.hardware.acceleration'), value: `${summary.accelerationPercent}%` },
    { label: t('admin.hardware.h264'), value: `${summary.h264HardwarePercent}%` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="bg-card flex flex-col gap-1 rounded-md border p-3">
            <dt className="text-muted-foreground text-xs">{card.label}</dt>
            <dd className="font-heading text-2xl font-medium tabular-nums">{card.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.hardware.user')}</TableHead>
              <TableHead>{t('admin.hardware.device')}</TableHead>
              <TableHead>CPU</TableHead>
              <TableHead>RAM</TableHead>
              <TableHead>GPU</TableHead>
              <TableHead>H.264</TableHead>
              <TableHead>{t('admin.hardware.lastSeen')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  {t('admin.hardware.noDevices')}
                </TableCell>
              </TableRow>
            )}
            {devices.map((device) => {
              const { cpu, memoryGb, gpu, encoders } = device.hardware
              const h264 = encoders.find((encoder) => encoder.codec === 'H.264')?.status ?? 'unsupported'
              return (
                <TableRow key={device.id} className="cursor-pointer" onClick={() => onOpenDevice(device.id)}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <UserAvatar name={device.user.name} imageUrl={device.user.avatarUrl} size="sm" />
                      {device.user.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="hover:underline focus-visible:underline focus-visible:outline-none"
                      onClick={() => onOpenDevice(device.id)}
                    >
                      {device.label}
                    </button>
                  </TableCell>
                  <TableCell className="tabular-nums">{cpu.logicalCores ?? '–'}</TableCell>
                  <TableCell className="tabular-nums">{memoryGb !== undefined ? `≈ ${memoryGb} GB` : '–'}</TableCell>
                  <TableCell className="max-w-56">
                    <span className="flex items-center gap-2">
                      <span className="truncate">{gpu.renderer ?? '–'}</span>
                      {!gpu.hardwareAcceleration && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                          software
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      h264 === 'hardware'
                        ? 'text-emerald-500'
                        : h264 === 'software'
                          ? 'text-amber-500'
                          : 'text-muted-foreground',
                    )}
                  >
                    {t(`hardware.encoder.${h264}`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeTime(device.lastSeenAt, i18n.language)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-xs">{t('hardware.limits')}</p>
    </div>
  )
}

export { HardwareTabView }
export type { AdminDeviceItem, HardwareSummary, HardwareTabViewProps }
