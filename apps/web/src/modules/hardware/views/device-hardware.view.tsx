import { cn } from 'cn'
import {
  CpuIcon,
  GaugeIcon,
  MemoryStickIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  VideoIcon,
  WifiIcon,
} from 'lucide-react'
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
  displays: readonly {
    width: number
    height: number
    scale: number
    refreshRate?: number
    isPrimary?: boolean
    label?: string
  }[]
  network?: { type: string; downlinkMbps: number; rttMs: number }
  /** Complemento digitado pelo usuário (o browser não expõe esses dados). */
  userProvided?: UserProvidedHardware
}

type ConnectionType = 'ethernet' | 'wifi' | 'mobile'

type UserProvidedHardware = {
  cpuModel?: string
  ramGb?: number
  gpuModel?: string
  vramGb?: number
  connection?: ConnectionType
  downloadMbps?: number
  uploadMbps?: number
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
  const { os, browser, cpu, memoryGb, gpu, encoders, displays, network, userProvided: manual = {} } = hardware
  const informed = (
    <Badge variant="outline" className="ml-1.5 h-4 px-1.5 text-[10px] font-normal">
      {t('hardware.userProvided')}
    </Badge>
  )

  return (
    <div className="flex flex-col gap-4">
      <Group icon={MonitorSmartphoneIcon} title={t('hardware.groups.system')}>
        <Row label={t('hardware.os')}>{[os.name, os.version].filter(Boolean).join(' ')}</Row>
        <Row label={t('hardware.architecture')}>
          {os.architecture ? [os.architecture, os.bitness && `${os.bitness}-bit`].filter(Boolean).join(' · ') : unknown}
        </Row>
        <Row label={t('hardware.browser')}>
          {browser.name} {browser.version}
        </Row>
      </Group>

      <Group icon={CpuIcon} title={t('hardware.groups.cpu')}>
        {manual.cpuModel && (
          <Row label={t('hardware.manual.cpuModel')}>
            {manual.cpuModel}
            {informed}
          </Row>
        )}
        <Row label={t('hardware.cores')}>{cpu.logicalCores ?? unknown}</Row>
      </Group>

      <Group icon={MemoryStickIcon} title={t('hardware.groups.memory')}>
        {manual.ramGb !== undefined ? (
          <Row label="RAM">
            {manual.ramGb} GB{informed}
          </Row>
        ) : (
          <Row label="RAM" hint={t('hardware.memoryHint')}>
            {memoryGb !== undefined ? t('hardware.memoryApprox', { value: memoryGb }) : unknown}
          </Row>
        )}
      </Group>

      <Group icon={GaugeIcon} title={t('hardware.groups.gpu')}>
        <Row label={t('hardware.gpu')}>{gpu.renderer ?? unknown}</Row>
        {manual.gpuModel && (
          <Row label={t('hardware.manual.gpuModel')}>
            {manual.gpuModel}
            {informed}
          </Row>
        )}
        {manual.vramGb !== undefined && (
          <Row label={t('hardware.vram')}>
            {manual.vramGb} GB{informed}
          </Row>
        )}
        <Row
          label={t('hardware.acceleration')}
          hint={gpu.hardwareAcceleration ? undefined : t('hardware.accelerationOffHint')}
        >
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
        {displaysPermission === 'denied' && (
          <p className="text-muted-foreground text-xs">{t('hardware.displaysDenied')}</p>
        )}
      </Group>

      <Group icon={WifiIcon} title={t('hardware.groups.network')}>
        <Row label={t('hardware.groups.network')}>
          {network
            ? t('hardware.networkValue', { type: network.type, downlink: network.downlinkMbps, rtt: network.rttMs })
            : unknown}
        </Row>
        {manual.connection && (
          <Row label={t('hardware.connectionType')}>
            {t(`hardware.manual.connections.${manual.connection}`)}
            {informed}
          </Row>
        )}
        {(manual.downloadMbps !== undefined || manual.uploadMbps !== undefined) && (
          <Row label={t('hardware.plan')}>
            {t('hardware.planValue', { download: manual.downloadMbps ?? '?', upload: manual.uploadMbps ?? '?' })}
            {informed}
          </Row>
        )}
      </Group>
    </div>
  )
}

function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <dl className="divide-y rounded-md border text-[13px]">{children}</dl>
    </section>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 px-3 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 text-right break-words')}>
        {children}
        {hint && <span className="text-muted-foreground block text-[11px] leading-snug">{hint}</span>}
      </dd>
    </div>
  )
}

export { DeviceHardwareView }
export type {
  ConnectionType,
  DeviceHardware,
  DeviceHardwareViewProps,
  DisplaysPermission,
  EncoderStatus,
  UserProvidedHardware,
}
