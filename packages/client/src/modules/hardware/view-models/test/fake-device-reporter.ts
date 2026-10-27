import { vi } from 'vitest'

import type { DeviceReport } from '@gameplay/contracts'

import type { DeviceReporter } from '../../model/services/device-reporter.service'

import { DEVICE_ID, deviceReport } from './hardware-seed'

/** `DeviceReporter` that answers with the given report (or fails when `fail` is set). */
function createFakeDeviceReporter(report: DeviceReport = deviceReport) {
  const reporter: DeviceReporter = {
    deviceId: () => DEVICE_ID,
    report: vi.fn(async () => report),
  }
  return reporter
}

export { createFakeDeviceReporter }
