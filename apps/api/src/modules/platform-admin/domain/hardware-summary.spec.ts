import type { CollectedHardware } from '@gameplay/shared'
import { makeCollected } from '../../accounts/test/hardware-seed'
import { summarizeHardware } from './hardware-summary'

// makeCollected's device with only the figures under test set (by default
// 8 cores, 8 GB, acceleration and H.264 by hardware).
function device({ cores = 8, memory = 8, acceleration = true, h264 = true }: Figures): CollectedHardware {
  const seeded = makeCollected()
  return {
    ...seeded,
    logicalCores: cores,
    deviceMemoryGb: memory,
    gpu: { ...seeded.gpu, hardwareAcceleration: acceleration },
    videoEncoding: {
      ...seeded.videoEncoding,
      h264: h264 === null ? null : { supported: true, smooth: true, powerEfficient: h264 },
    },
  }
}

type Figures = { cores?: number | null; memory?: number | null; acceleration?: boolean | null; h264?: boolean | null }

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
