import type { DeviceReport, ReportDeviceRequest } from '@gameplay/contracts'

import { browserHardwareEnv } from '@/modules/hardware/model/services/browser-hardware-env'
import { getDeviceId } from '@/modules/hardware/model/services/device-id.service'
import {
  createHardwareCollector,
  type HardwareCollector,
} from '@/modules/hardware/model/services/hardware-collector.service'
import { reportDevice } from '@/modules/hardware/model/services/hardware.service'

type DeviceReporterDeps = {
  collector: HardwareCollector
  deviceId: () => string
  send: (request: ReportDeviceRequest) => Promise<DeviceReport>
}

type DeviceReporter = {
  /** The id this browser reports under. */
  deviceId: () => string
  /** Collects this device and sends it. `withDisplays` only when the monitors permission was granted. */
  report: (options: { withDisplays: boolean }) => Promise<DeviceReport>
}

function createDeviceReporter(deps: DeviceReporterDeps): DeviceReporter {
  return {
    deviceId: deps.deviceId,
    async report(options) {
      const collected = await deps.collector.collect(options)
      return deps.send({ deviceId: deps.deviceId(), collected })
    },
  }
}

const deviceReporter = createDeviceReporter({
  collector: createHardwareCollector(browserHardwareEnv),
  deviceId: () => getDeviceId(),
  send: reportDevice,
})

export { createDeviceReporter, deviceReporter }
export type { DeviceReporter, DeviceReporterDeps }
