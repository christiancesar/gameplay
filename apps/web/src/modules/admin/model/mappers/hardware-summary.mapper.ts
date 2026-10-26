import type { HardwareSummary as ApiHardwareSummary } from '@gameplay/contracts'

import type { HardwareSummary } from '@/modules/admin/model/entities/admin-device-item'

/** null (no device reported the figure) becomes "no minimum" for the cores and 0% for the shares. */
function toHardwareSummary(summary: ApiHardwareSummary): HardwareSummary {
  return {
    devices: summary.devices,
    minCores: summary.minLogicalCores ?? undefined,
    minMemoryGb: summary.minDeviceMemoryGb ?? undefined,
    accelerationPercent: summary.hardwareAccelerationPercent ?? 0,
    h264HardwarePercent: summary.h264HardwarePercent ?? 0,
  }
}

const EMPTY_HARDWARE_SUMMARY: HardwareSummary = { devices: 0, accelerationPercent: 0, h264HardwarePercent: 0 }

export { EMPTY_HARDWARE_SUMMARY, toHardwareSummary }
