import { describe, expect, it } from 'vitest'

import { toHardwareSummary } from './hardware-summary.mapper'

describe('toHardwareSummary', () => {
  it('renames the API fields', () => {
    expect(
      toHardwareSummary({
        devices: 4,
        minLogicalCores: 4,
        minDeviceMemoryGb: 2,
        hardwareAccelerationPercent: 75,
        h264HardwarePercent: 50.5,
      }),
    ).toEqual({ devices: 4, minCores: 4, minMemoryGb: 2, accelerationPercent: 75, h264HardwarePercent: 50.5 })
  })

  it('turns null figures into no minimum and 0%', () => {
    expect(
      toHardwareSummary({
        devices: 0,
        minLogicalCores: null,
        minDeviceMemoryGb: null,
        hardwareAccelerationPercent: null,
        h264HardwarePercent: null,
      }),
    ).toEqual({
      devices: 0,
      minCores: undefined,
      minMemoryGb: undefined,
      accelerationPercent: 0,
      h264HardwarePercent: 0,
    })
  })
})
