import { DeviceNotFoundError } from '../errors/accounts.errors'
import { InMemoryDeviceReportsRepository } from '../repositories/in-memory/in-memory-device-reports.repository'
import { makeCollected, makeManual } from '../test/hardware-seed'
import { ListMyDevicesUseCase } from './list-my-devices.use-case'
import { ReportDeviceUseCase } from './report-device.use-case'
import { UpdateDeviceManualInfoUseCase } from './update-device-manual-info.use-case'

const DEVICE_A = '6f1c2a52-8a3b-4d0e-9a39-0d8e6c1f2b10'
const DEVICE_B = '0b7e3d2f-1c4a-4e5b-8f6d-2a9c7e1b3d40'

describe('Device reports', () => {
  function makeSut() {
    const devices = new InMemoryDeviceReportsRepository()
    return {
      devices,
      report: new ReportDeviceUseCase(devices),
      updateManual: new UpdateDeviceManualInfoUseCase(devices),
      list: new ListMyDevicesUseCase(devices),
    }
  }

  it('creates one report for a new device', async () => {
    const { report, devices } = makeSut()

    const created = await report.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })

    expect(created.manual).toBeNull()
    expect(devices.reports).toHaveLength(1)
  })

  it('updates the same device instead of adding another', async () => {
    const { report, devices } = makeSut()
    const first = await report.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })

    const second = await report.execute({
      userId: 'u1',
      deviceId: DEVICE_A,
      collected: makeCollected({ logicalCores: 8 }),
    })

    expect(devices.reports).toHaveLength(1)
    expect(second.id).toBe(first.id)
    expect(second.collected.logicalCores).toBe(8)
    expect(second.collectedAt.getTime()).toBeGreaterThanOrEqual(first.collectedAt.getTime())
  })

  it('keeps the manual info on a new collection', async () => {
    const { report, updateManual } = makeSut()
    await report.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })
    await updateManual.execute({ userId: 'u1', deviceId: DEVICE_A, manual: makeManual() })

    const recollected = await report.execute({
      userId: 'u1',
      deviceId: DEVICE_A,
      collected: makeCollected({ logicalCores: 4 }),
    })

    expect(recollected.manual).toEqual(makeManual())
  })

  it('keeps devices of different users apart', async () => {
    const { report, list } = makeSut()
    await report.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })
    await report.execute({ userId: 'u1', deviceId: DEVICE_B, collected: makeCollected() })
    await report.execute({ userId: 'u2', deviceId: DEVICE_A, collected: makeCollected() })

    expect(await list.execute('u1')).toHaveLength(2)
    expect(await list.execute('u2')).toHaveLength(1)
  })

  it('refuses manual info for a device that never reported', async () => {
    const { report, updateManual } = makeSut()
    await report.execute({ userId: 'u2', deviceId: DEVICE_A, collected: makeCollected() })

    await expect(updateManual.execute({ userId: 'u1', deviceId: DEVICE_A, manual: makeManual() })).rejects.toThrow(
      DeviceNotFoundError,
    )
  })
})
