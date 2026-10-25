import type {
  DeviceHardware,
  EncoderStatus,
  DisplaysPermission,
} from '@/modules/hardware/model/entities/device-hardware'
import {
  CpuIcon,
  GaugeIcon,
  MemoryStickIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  VideoIcon,
  WifiIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

import { HardwareGroup } from './hardware-group.view'
import { HardwareRow } from './hardware-row.view'

/**
 * Vem do `videoEncoding` do relatório: `powerEfficient` conta como hardware,
 * `supported` sem `powerEfficient` como software, e null ou não suportado como unsupported.
 */
/** Dados que o Chrome expõe; campos ausentes não foram informados pelo browser. */
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
      <HardwareGroup icon={MonitorSmartphoneIcon} title={t('hardware.groups.system')}>
        <HardwareRow label={t('hardware.os')}>{[os.name, os.version].filter(Boolean).join(' ')}</HardwareRow>
        <HardwareRow label={t('hardware.architecture')}>
          {os.architecture ? [os.architecture, os.bitness && `${os.bitness}-bit`].filter(Boolean).join(' · ') : unknown}
        </HardwareRow>
        <HardwareRow label={t('hardware.browser')}>
          {browser.name} {browser.version}
        </HardwareRow>
      </HardwareGroup>

      <HardwareGroup icon={CpuIcon} title={t('hardware.groups.cpu')}>
        {manual.cpuModel && (
          <HardwareRow label={t('hardware.manual.cpuModel')}>
            {manual.cpuModel}
            {informed}
          </HardwareRow>
        )}
        <HardwareRow label={t('hardware.cores')}>{cpu.logicalCores ?? unknown}</HardwareRow>
      </HardwareGroup>

      <HardwareGroup icon={MemoryStickIcon} title={t('hardware.groups.memory')}>
        {manual.ramGb !== undefined ? (
          <HardwareRow label="RAM">
            {manual.ramGb} GB{informed}
          </HardwareRow>
        ) : (
          <HardwareRow label="RAM" hint={t('hardware.memoryHint')}>
            {memoryGb !== undefined ? t('hardware.memoryApprox', { value: memoryGb }) : unknown}
          </HardwareRow>
        )}
      </HardwareGroup>

      <HardwareGroup icon={GaugeIcon} title={t('hardware.groups.gpu')}>
        <HardwareRow label={t('hardware.gpu')}>{gpu.renderer ?? unknown}</HardwareRow>
        {manual.gpuModel && (
          <HardwareRow label={t('hardware.manual.gpuModel')}>
            {manual.gpuModel}
            {informed}
          </HardwareRow>
        )}
        {manual.vramGb !== undefined && (
          <HardwareRow label={t('hardware.vram')}>
            {manual.vramGb} GB{informed}
          </HardwareRow>
        )}
        <HardwareRow
          label={t('hardware.acceleration')}
          hint={gpu.hardwareAcceleration ? undefined : t('hardware.accelerationOffHint')}
        >
          <span className={gpu.hardwareAcceleration ? 'text-emerald-500' : 'text-amber-500'}>
            {gpu.hardwareAcceleration ? t('hardware.accelerationOn') : t('hardware.accelerationOff')}
          </span>
        </HardwareRow>
        <HardwareRow label={t('hardware.webgpu')}>
          {gpu.webgpu ? t('hardware.available') : t('hardware.unavailable')}
        </HardwareRow>
      </HardwareGroup>

      <HardwareGroup icon={VideoIcon} title={t('hardware.groups.encoding')}>
        {encoders.map((encoder) => (
          <HardwareRow key={encoder.codec} label={`${encoder.codec} · 1080p60`}>
            <span className={ENCODER_CLASS[encoder.status]}>{t(`hardware.encoder.${encoder.status}`)}</span>
          </HardwareRow>
        ))}
      </HardwareGroup>

      <HardwareGroup icon={MonitorIcon} title={t('hardware.groups.displays')}>
        {displays.map((display, index) => (
          <HardwareRow key={index} label={display.label ?? `#${index + 1}`}>
            <span className="flex items-center justify-end gap-2">
              {t('hardware.displayItem', { width: display.width, height: display.height, scale: display.scale })}
              {display.refreshRate && ` · ${display.refreshRate} Hz`}
              {display.isPrimary && <Badge variant="secondary">{t('hardware.primary')}</Badge>}
            </span>
          </HardwareRow>
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
      </HardwareGroup>

      <HardwareGroup icon={WifiIcon} title={t('hardware.groups.network')}>
        <HardwareRow label={t('hardware.groups.network')}>
          {network
            ? t('hardware.networkValue', { type: network.type, downlink: network.downlinkMbps, rtt: network.rttMs })
            : unknown}
        </HardwareRow>
        {manual.connection && (
          <HardwareRow label={t('hardware.connectionType')}>
            {t(`hardware.manual.connections.${manual.connection}`)}
            {informed}
          </HardwareRow>
        )}
        {(manual.downloadMbps !== undefined || manual.uploadMbps !== undefined) && (
          <HardwareRow label={t('hardware.plan')}>
            {t('hardware.planValue', { download: manual.downloadMbps ?? '?', upload: manual.uploadMbps ?? '?' })}
            {informed}
          </HardwareRow>
        )}
      </HardwareGroup>
    </div>
  )
}

export { DeviceHardwareView }
export type { DeviceHardwareViewProps }
