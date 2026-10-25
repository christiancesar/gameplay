import type { DeviceReport } from '@gameplay/contracts'

import type { DeviceHardware, UserProvidedHardware } from '@/modules/hardware/views/device-hardware.view'

type EncoderEntry = DeviceHardware['encoders'][number]
type CodecSupport = DeviceReport['collected']['videoEncoding']['h264']

const orUndefined = <T>(value: T | null | undefined): T | undefined => value ?? undefined

/** `powerEfficient` means the hardware encoder; supported without it means software. */
function encoderStatus(support: CodecSupport): EncoderEntry['status'] {
  if (!support?.supported) return 'unsupported'
  return support.powerEfficient ? 'hardware' : 'software'
}

function toUserProvided(manual: DeviceReport['manual']): UserProvidedHardware {
  if (!manual) return {}
  const entries = {
    cpuModel: orUndefined(manual.cpuModel),
    ramGb: orUndefined(manual.ramGb),
    gpuModel: orUndefined(manual.gpuModel),
    vramGb: orUndefined(manual.vramGb),
    connection: orUndefined(manual.connectionType),
    downloadMbps: orUndefined(manual.internetDownloadMbps),
    uploadMbps: orUndefined(manual.internetUploadMbps),
  }
  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value !== undefined))
}

/** The stored report as the hardware View wants it: null becomes "not reported". */
function toDeviceHardware(report: DeviceReport): DeviceHardware {
  const { collected } = report
  const { os, browser, gpu, network, videoEncoding } = collected
  const hasNetwork = network.effectiveType !== null && network.downlinkMbps !== null && network.rttMs !== null

  return {
    os: {
      name: os.platform ?? '',
      version: orUndefined(os.version),
      architecture: orUndefined(os.architecture),
      bitness: orUndefined(os.bitness),
    },
    browser: { name: browser.brand ?? '', version: browser.version ?? '' },
    cpu: { logicalCores: orUndefined(collected.logicalCores) },
    memoryGb: orUndefined(collected.deviceMemoryGb),
    gpu: {
      vendor: orUndefined(gpu.vendor),
      renderer: orUndefined(gpu.renderer),
      hardwareAcceleration: gpu.hardwareAcceleration ?? false,
      webgpu: gpu.webgpu ?? false,
    },
    encoders: [
      { codec: 'H.264', status: encoderStatus(videoEncoding.h264) },
      { codec: 'VP9', status: encoderStatus(videoEncoding.vp9) },
      { codec: 'AV1', status: encoderStatus(videoEncoding.av1) },
    ],
    displays: (collected.displays ?? []).map((display) => ({
      width: display.width,
      height: display.height,
      scale: display.scaleFactor,
      refreshRate: orUndefined(display.refreshRate),
      isPrimary: orUndefined(display.isPrimary),
      label: orUndefined(display.label),
    })),
    network: hasNetwork
      ? { type: network.effectiveType!, downlinkMbps: network.downlinkMbps!, rttMs: network.rttMs! }
      : undefined,
    userProvided: toUserProvided(report.manual),
  }
}

export { toDeviceHardware }
