import type { CollectedHardware, ManualHardware } from '@gameplay/shared'

// Hardware reports as the web would send them, for the accounts and platform
// admin tests. Pass overrides for the figures under test.

export function makeCollected(overrides: Partial<CollectedHardware> = {}): CollectedHardware {
  return {
    os: { platform: 'Windows', version: '15.0.0', architecture: 'x86', bitness: '64' },
    browser: { brand: 'Google Chrome', version: '141.0.0.0' },
    logicalCores: 16,
    deviceMemoryGb: 8,
    gpu: { vendor: 'NVIDIA', renderer: 'NVIDIA GeForce RTX 4070', hardwareAcceleration: true, webgpu: true },
    videoEncoding: {
      h264: { supported: true, smooth: true, powerEfficient: true },
      vp9: { supported: true, smooth: true, powerEfficient: false },
      av1: { supported: true, smooth: true, powerEfficient: true },
    },
    network: { effectiveType: '4g', downlinkMbps: 10, rttMs: 50, saveData: false },
    displays: null,
    ...overrides,
  }
}

export function makeManual(overrides: Partial<ManualHardware> = {}): ManualHardware {
  return {
    cpuModel: 'Ryzen 7 7800X3D',
    ramGb: 32,
    gpuModel: null,
    vramGb: 12,
    connectionType: 'wired',
    internetDownloadMbps: 500,
    internetUploadMbps: 250,
    ...overrides,
  }
}
