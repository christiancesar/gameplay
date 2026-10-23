import { cn } from 'cn'
import { CpuIcon, GaugeIcon, MemoryStickIcon, MonitorIcon, MonitorSmartphoneIcon, VideoIcon, WifiIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

type EncoderStatus = 'hardware' | 'software' | 'unsupported'

type DisplaysPermission = 'granted' | 'prompt' | 'denied' | 'unsupported'

/** Dados que o Chrome expõe; campos ausentes não foram informados pelo browser. */
type DeviceHardware = {
  os: { name: string; version?: string; architecture?: string; bitness?: string }
  browser: { name: string; version: string }
  cpu: { logicalCores?: number }
  memoryGb?: number
  gpu: { vendor?: string; renderer?: string; hardwareAcceleration: boolean; webgpu: boolean }
  encoders: readonly { codec: 'H.264' | 'VP9' | 'AV1'; status: EncoderStatus }[]
  displays: readonly { width: number; height: number; scale: number; refreshRate?: number; isPrimary?: boolean; label?: string }[]
  network?: { type: string; downlinkMbps: number; rttMs: number }
}

type DeviceHardwareViewProps = {
  hardware: DeviceHardware
  displaysPermission: DisplaysPermission
  /** Só na própria máquina: pede a permissão de ver todos os monitores. */
  onAllowDisplays?: () => void
}

const ENCODER_CLASS: Record<EncoderStatus, string> = {
  hardware: 'text-emerald-500',
  software: 'text-amber-500',
  unsupported: 'text-muted-foreground',
}

function DeviceHardwareView({ hardware, displaysPermission, onAllowDisplays }: DeviceHardwareViewProps) {
  const { t } = useTranslation()
  const unknown = <span className="text-muted-foreground">{t('hardware.unknown')}</span>
  const { os, browser, cpu, memoryGb, gpu, encoders, displays, network } = hardware

  return (
    <div className="flex flex-col gap-5">
      <Group icon={MonitorSmartphoneIcon} title={t('hardware.groups.system')}>
        <Row label={t('hardware.os')}>{[os.name, os.version].filter(Boolean).join(' ')}</Row>
        <Row label={t('hardware.architecture')}>{os.architecture ? [os.architecture, os.bitness && `${os.bitness}-bit`].filter(Boolean).join(' · ') : unknown}</Row>
        <Row label={t('hardware.browser')}>
          {browser.name} {browser.version}
        </Row>
      </Group>

      <Group icon={CpuIcon} title={t('hardware.groups.cpu')}>
        <Row label={t('hardware.cores')}>{cpu.logicalCores ?? unknown}</Row>
      </Group>

      <Group icon={MemoryStickIcon} title={t('hardware.groups.memory')}>
        <Row label="RAM" hint={t('hardware.memoryHint')}>
          {memoryGb !== undefined ? t('hardware.memoryApprox', { value: memoryGb }) : unknown}
        </Row>
      </Group>

      <Group icon={GaugeIcon} title={t('hardware.groups.gpu')}>
        <Row label={t('hardware.gpu')}>{gpu.renderer ?? unknown}</Row>
        <Row label={t('hardware.acceleration')} hint={gpu.hardwareAcceleration ? undefined : t('hardware.accelerationOffHint')}>
          <span className={gpu.hardwareAcceleration ? 'text-emerald-500' : 'text-amber-500'}>
            {gpu.hardwareAcceleration ? t('hardware.accelerationOn') : t('hardware.accelerationOff')}
          </span>
        </Row>
        <Row label={t('hardware.webgpu')}>{gpu.webgpu ? t('hardware.available') : t('hardware.unavailable')}</Row>
      </Group>

      <Group icon={VideoIcon} title={t('hardware.groups.encoding')}>
        {encoders.map((encoder) => (
          <Row key={encoder.codec} label={`${encoder.codec} · 1080p60`}>
            <span className={ENCODER_CLASS[encoder.status]}>{t(`hardware.encoder.${encoder.status}`)}</span>
          </Row>
        ))}
      </Group>

      <Group icon={MonitorIcon} title={t('hardware.groups.displays')}>
        {displays.map((display, index) => (
          <Row key={index} label={display.label ?? `#${index + 1}`}>
            <span className="flex items-center justify-end gap-2">
              {t('hardware.displayItem', { width: display.width, height: display.height, scale: display.scale })}
              {display.refreshRate && ` · ${display.refreshRate} Hz`}
              {display.isPrimary && <Badge variant="secondary">{t('hardware.primary')}</Badge>}
            </span>
          </Row>
        ))}
        {displaysPermission === 'prompt' && onAllowDisplays && (
          <div className="bg-muted/60 flex items-center justify-between gap-3 rounded-md p-3 text-xs">
            <span className="text-muted-foreground">{t('hardware.displaysPermission')}</span>
            <Button size="sm" onClick={onAllowDisplays}>
              {t('hardware.allow')}
            </Button>
          </div>
        )}
        {displaysPermission === 'denied' && <p className="text-muted-foreground text-xs">{t('hardware.displaysDenied')}</p>}
      </Group>

      <Group icon={WifiIcon} title={t('hardware.groups.network')}>
        <Row label={t('hardware.groups.network')}>
          {network ? t('hardware.networkValue', { type: network.type, downlink: network.downlinkMbps, rtt: network.rttMs }) : unknown}
        </Row>
      </Group>
    </div>
  )
}

function Group({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Icon className="text-muted-foreground size-4" />
        {title}
      </h3>
      <dl className="divide-y rounded-md border text-sm">{children}</dl>
    </section>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 text-right break-words')}>
        {children}
        {hint && <span className="text-muted-foreground mt-0.5 block text-[11px]">{hint}</span>}
      </dd>
    </div>
  )
}

export { DeviceHardwareView }
export type { DeviceHardware, DeviceHardwareViewProps, DisplaysPermission, EncoderStatus }
