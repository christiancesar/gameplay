import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))

import { fakeHttp } from '@/shared/test/fake-http'

import { DEVICE_ID, collected, deviceReport, manualReport } from '../../view-models/test/hardware-seed'

import { listMyDevices, reportDevice, saveManualHardware } from './hardware.service'

describe('hardware service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reports the device and parses the stored report', async () => {
    fakeHttp.post.mockResolvedValue({ data: deviceReport })
    await expect(reportDevice({ deviceId: DEVICE_ID, collected })).resolves.toEqual(deviceReport)
    expect(fakeHttp.post).toHaveBeenCalledWith('/me/devices', { deviceId: DEVICE_ID, collected })
  })

  it('lists the devices', async () => {
    fakeHttp.get.mockResolvedValue({ data: { devices: [deviceReport] } })
    await expect(listMyDevices()).resolves.toEqual([deviceReport])
    expect(fakeHttp.get).toHaveBeenCalledWith('/me/devices')
  })

  it('saves the manual data of one device', async () => {
    fakeHttp.put.mockResolvedValue({ data: manualReport })
    const manual = manualReport.manual!
    await expect(saveManualHardware(DEVICE_ID, manual)).resolves.toEqual(manualReport)
    expect(fakeHttp.put).toHaveBeenCalledWith(`/me/devices/${DEVICE_ID}/manual`, manual)
  })
})
