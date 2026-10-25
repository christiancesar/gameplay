import type { CollectedHardware, DeviceReport } from '@gameplay/contracts'

import type { AdminDeviceItem } from '@/modules/admin/views/hardware-tab.view'
import type { DeviceHardware, EncoderStatus } from '@/modules/hardware/views/device-hardware.view'

type DeviceOwner = AdminDeviceItem['user']

/** powerEfficient counts as hardware, supported without it as software, anything else as unsupported. */
function encoderStatus(codec: CollectedHardware['videoEncoding']['h264']): EncoderStatus {
  if (!codec?.supported) return 'unsupported'
  return codec.powerEfficient ? 'hardware' : 'software'
}

function toDeviceHardware({ collected, manual }: Pick<DeviceReport, 'collected' | 'manual'>): DeviceHardware {
  const { os, browser, gpu, network, displays } = collected
  return {
    os: {
      name: os.platform ?? '',
      version: os.version ?? undefined,
      architecture: os.architecture ?? undefined,
      bitness: os.bitness ?? undefined,
    },
    browser: { name: browser.brand ?? '', version: browser.version ?? '' },
    cpu: { logicalCores: collected.logicalCores ?? undefined },
    memoryGb: collected.deviceMemoryGb ?? undefined,
    gpu: {
      vendor: gpu.vendor ?? undefined,
      renderer: gpu.renderer ?? undefined,
      hardwareAcceleration: gpu.hardwareAcceleration ?? false,
      webgpu: gpu.webgpu ?? false,
    },
    encoders: [
      { codec: 'H.264', status: encoderStatus(collected.videoEncoding.h264) },
      { codec: 'VP9', status: encoderStatus(collected.videoEncoding.vp9) },
      { codec: 'AV1', status: encoderStatus(collected.videoEncoding.av1) },
    ],
    displays: (displays ?? []).map((display) => ({
      width: display.width,
      height: display.height,
      scale: display.scaleFactor,
      refreshRate: display.refreshRate ?? undefined,
      isPrimary: display.isPrimary ?? undefined,
      label: display.label ?? undefined,
    })),
    network:
      network.effectiveType !== null && network.downlinkMbps !== null && network.rttMs !== null
        ? { type: network.effectiveType, downlinkMbps: network.downlinkMbps, rttMs: network.rttMs }
        : undefined,
    userProvided: manual
      ? {
          cpuModel: manual.cpuModel ?? undefined,
          ramGb: manual.ramGb ?? undefined,
          gpuModel: manual.gpuModel ?? undefined,
          vramGb: manual.vramGb ?? undefined,
          connection: manual.connectionType ?? undefined,
          downloadMbps: manual.internetDownloadMbps ?? undefined,
          uploadMbps: manual.internetUploadMbps ?? undefined,
        }
      : undefined,
  }
}

/** "Windows 11 · Chrome 141", with whatever the browser reported. */
function deviceLabel({ collected }: Pick<DeviceReport, 'collected'>): string {
  const system = [collected.os.platform, collected.os.version].filter(Boolean).join(' ')
  const browser = [collected.browser.brand, collected.browser.version].filter(Boolean).join(' ')
  return [system, browser].filter(Boolean).join(' · ') || '–'
}

function toAdminDeviceItem(report: DeviceReport, user: DeviceOwner): AdminDeviceItem {
  return {
    id: report.id,
    user,
    label: deviceLabel(report),
    lastSeenAt: report.collectedAt,
    hardware: toDeviceHardware(report),
  }
}

export { toAdminDeviceItem, toDeviceHardware }
