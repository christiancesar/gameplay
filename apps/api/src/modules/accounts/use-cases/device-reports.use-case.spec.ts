import { DeviceNotFoundError } from '../errors/accounts.errors'
import { makeCollected, makeManual } from '../test/hardware-seed'
import { makeAccountsContext } from '../test/accounts-context'
import { DEVICE_A, DEVICE_B } from '../test/accounts-seed'

describe('Device reports', () => {
  it('creates one report for a new device', async () => {
    const { reportDevice, devices } = makeAccountsContext()

    const created = await reportDevice.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })

    expect(created.manual).toBeNull()
    expect(devices.reports).toHaveLength(1)
  })

  it('updates the same device instead of adding another', async () => {
    const { reportDevice, devices } = makeAccountsContext()
    const first = await reportDevice.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })

    const second = await reportDevice.execute({
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
    const { reportDevice, updateManual } = makeAccountsContext()
    await reportDevice.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })
    await updateManual.execute({ userId: 'u1', deviceId: DEVICE_A, manual: makeManual() })

    const recollected = await reportDevice.execute({
      userId: 'u1',
      deviceId: DEVICE_A,
      collected: makeCollected({ logicalCores: 4 }),
    })

    expect(recollected.manual).toEqual(makeManual())
  })

  it('keeps devices of different users apart', async () => {
    const { reportDevice, listDevices } = makeAccountsContext()
    await reportDevice.execute({ userId: 'u1', deviceId: DEVICE_A, collected: makeCollected() })
    await reportDevice.execute({ userId: 'u1', deviceId: DEVICE_B, collected: makeCollected() })
    await reportDevice.execute({ userId: 'u2', deviceId: DEVICE_A, collected: makeCollected() })

    expect(await listDevices.execute('u1')).toHaveLength(2)
    expect(await listDevices.execute('u2')).toHaveLength(1)
  })

  it('refuses manual info for a device that never reported', async () => {
    const { reportDevice, updateManual } = makeAccountsContext()
    await reportDevice.execute({ userId: 'u2', deviceId: DEVICE_A, collected: makeCollected() })

    await expect(updateManual.execute({ userId: 'u1', deviceId: DEVICE_A, manual: makeManual() })).rejects.toThrow(
      DeviceNotFoundError,
    )
  })
})
