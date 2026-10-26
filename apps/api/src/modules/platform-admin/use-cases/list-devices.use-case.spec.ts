import { makePlatformAdminContext } from '../test/platform-admin-context'

describe('ListDevicesUseCase', () => {
  it('lists every report newest first, with the user, in pages', async () => {
    const { listDevices } = makePlatformAdminContext()

    const first = await listDevices.execute({ page: 1, pageSize: 2 })
    expect(first.total).toBe(3)
    expect(first.items.map(({ user, deviceId }) => [user.username, deviceId])).toEqual([
      ['ana', 'laptop'],
      ['ana', 'phone'],
    ])
    const second = await listDevices.execute({ page: 2, pageSize: 2 })
    expect(second.items.map(({ deviceId }) => deviceId)).toEqual(['desktop'])
  })

  it('searches by username, ignoring case', async () => {
    const { listDevices } = makePlatformAdminContext()

    const found = await listDevices.execute({ search: 'BIA', page: 1, pageSize: 20 })

    expect(found.total).toBe(1)
    expect(found.items[0].user).toEqual({ id: 'bia', username: 'bia' })
  })
})
