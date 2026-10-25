import type { CollectedHardware } from '@gameplay/shared'
import { summarizeHardware } from './hardware-summary'

const codec = (powerEfficient: boolean) => ({ supported: true, smooth: true, powerEfficient })

function device(overrides: {
  cores?: number | null
  memory?: number | null
  acceleration?: boolean | null
  h264?: boolean | null
}): CollectedHardware {
  const { cores = 8, memory = 8, acceleration = true, h264 = true } = overrides
  return {
    os: { platform: 'Windows', version: '15.0.0', architecture: 'x86', bitness: '64' },
    browser: { brand: 'Google Chrome', version: '131' },
    logicalCores: cores,
    deviceMemoryGb: memory,
    gpu: { vendor: null, renderer: null, hardwareAcceleration: acceleration, webgpu: null },
    videoEncoding: { h264: h264 === null ? null : codec(h264), vp9: null, av1: null },
    network: { effectiveType: null, downlinkMbps: null, rttMs: null, saveData: null },
    displays: null,
  }
}

describe('summarizeHardware', () => {
  it('finds the weakest device and the share with acceleration and H.264 by hardware', () => {
    const summary = summarizeHardware([
      device({ cores: 8, memory: 8 }),
      device({ cores: 4, memory: 2, acceleration: false, h264: false }),
      device({ cores: 12, memory: 4, h264: false }),
    ])

    expect(summary).toEqual({
      devices: 3,
      minLogicalCores: 4,
      minDeviceMemoryGb: 2,
      hardwareAccelerationPercent: 66.7,
      h264HardwarePercent: 33.3,
    })
  })

  it('leaves out the devices that did not report a figure', () => {
    const summary = summarizeHardware([
      device({ cores: null, memory: null, acceleration: null, h264: null }),
      device({ cores: 6, memory: 4, acceleration: false, h264: true }),
    ])

    expect(summary).toEqual({
      devices: 2,
      minLogicalCores: 6,
      minDeviceMemoryGb: 4,
      hardwareAccelerationPercent: 0,
      h264HardwarePercent: 100,
    })
  })

  it('has no figures without devices', () => {
    expect(summarizeHardware([])).toEqual({
      devices: 0,
      minLogicalCores: null,
      minDeviceMemoryGb: null,
      hardwareAccelerationPercent: null,
      h264HardwarePercent: null,
    })
  })
})
