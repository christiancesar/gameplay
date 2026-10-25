import type { CollectedHardware, HardwareSummary } from '@gameplay/contracts'

// Weakest device of the base and how common acceleration and H.264 encoding
// by hardware are. Each figure looks only at the devices that reported it.
export function summarizeHardware(devices: CollectedHardware[]): HardwareSummary {
  const cores = known(devices.map((device) => device.logicalCores))
  const memory = known(devices.map((device) => device.deviceMemoryGb))
  const acceleration = known(devices.map((device) => device.gpu.hardwareAcceleration))
  const h264 = known(devices.map((device) => device.videoEncoding.h264?.powerEfficient ?? null))

  return {
    devices: devices.length,
    minLogicalCores: cores.length ? Math.min(...cores) : null,
    minDeviceMemoryGb: memory.length ? Math.min(...memory) : null,
    hardwareAccelerationPercent: percentTrue(acceleration),
    h264HardwarePercent: percentTrue(h264),
  }
}

function known<T>(values: (T | null)[]): T[] {
  return values.filter((value): value is T => value !== null)
}

// One decimal place.
function percentTrue(values: boolean[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.filter(Boolean).length / values.length) * 1000) / 10
}
