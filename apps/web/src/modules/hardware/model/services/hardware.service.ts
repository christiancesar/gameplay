import {
  deviceReportSchema,
  listDevicesResponseSchema,
  type DeviceReport,
  type ManualHardware,
  type ReportDeviceRequest,
} from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

/** Creates the report of a device, or replaces its collected data. The manual part is kept. */
async function reportDevice(request: ReportDeviceRequest): Promise<DeviceReport> {
  const { data } = await http.post('/me/devices', request)
  return deviceReportSchema.parse(data)
}

async function listMyDevices(): Promise<DeviceReport[]> {
  const { data } = await http.get('/me/devices')
  return listDevicesResponseSchema.parse(data).devices
}

/** Replaces the whole manual object. 404 when the device never sent a collection. */
async function saveManualHardware(deviceId: string, manual: ManualHardware): Promise<DeviceReport> {
  const { data } = await http.put(`/me/devices/${deviceId}/manual`, manual)
  return deviceReportSchema.parse(data)
}

export { listMyDevices, reportDevice, saveManualHardware }
