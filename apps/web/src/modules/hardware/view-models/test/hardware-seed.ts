import type { CollectedHardware, DeviceReport } from '@gameplay/contracts'

import type { HardwareEnv } from '../../model/services/hardware-collector.service'

const DEVICE_ID = '7b0c1f4e-5a1d-4b8e-9c55-0d2f9a6e3c11'

const collected: CollectedHardware = {
  os: { platform: 'Windows', version: '15.0.0', architecture: 'x86', bitness: '64' },
  browser: { brand: 'Google Chrome', version: '141' },
  logicalCores: 16,
  deviceMemoryGb: 8,
  gpu: {
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA GeForce RTX 3070)',
    hardwareAcceleration: true,
    webgpu: true,
  },
  videoEncoding: {
    h264: { supported: true, smooth: true, powerEfficient: true },
    vp9: { supported: true, smooth: true, powerEfficient: false },
    av1: null,
  },
  network: { effectiveType: '4g', downlinkMbps: 10, rttMs: 50, saveData: false },
  displays: [
    {
      label: 'LG 27GL850',
      width: 2560,
      height: 1440,
      scaleFactor: 1,
      refreshRate: null,
      isPrimary: true,
      isInternal: false,
    },
  ],
}

const deviceReport: DeviceReport = {
  id: 'rep-1',
  deviceId: DEVICE_ID,
  collected,
  manual: null,
  collectedAt: '2026-10-25T12:00:00.000Z',
}

const manualReport: DeviceReport = {
  ...deviceReport,
  manual: {
    cpuModel: 'Ryzen 7 5800X',
    ramGb: 32,
    gpuModel: null,
    vramGb: 8,
    connectionType: 'wired',
    internetDownloadMbps: 500,
    internetUploadMbps: null,
  },
}

/** A Chromium-like browser exposing everything the collector reads. */
const chromiumEnv = (): HardwareEnv => ({
  navigator: {
    userAgentData: {
      platform: 'Windows',
      brands: [
        { brand: 'Not.A/Brand', version: '8' },
        { brand: 'Chromium', version: '141' },
        { brand: 'Google Chrome', version: '141' },
      ],
      getHighEntropyValues: async () => ({ platformVersion: '15.0.0', architecture: 'x86', bitness: '64' }),
    },
    hardwareConcurrency: 16,
    deviceMemory: 8,
    gpu: {},
    connection: { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false },
    mediaCapabilities: {
      encodingInfo: async (configuration) => {
        const contentType = (configuration as { video: { contentType: string } }).video.contentType
        if (contentType === 'video/AV1') return { supported: false, smooth: false, powerEfficient: false }
        return { supported: true, smooth: true, powerEfficient: contentType === 'video/H264' }
      },
    },
  },
  readGpu: () => ({ vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA GeForce RTX 3070)' }),
  readScreens: async () => [
    { label: 'LG 27GL850', width: 2560, height: 1440, devicePixelRatio: 1, isPrimary: true, isInternal: false },
  ],
})

export { DEVICE_ID, chromiumEnv, collected, deviceReport, manualReport }
