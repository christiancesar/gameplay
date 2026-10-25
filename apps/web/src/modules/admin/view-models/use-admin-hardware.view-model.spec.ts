import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))

import { createAdminViewModelContext } from './test/admin-view-model-context'
import { adminUser } from './test/admin-seed'
import { gamingDevice, sparseDevice } from './test/device-seed'
import { useAdminHardwareViewModel } from './use-admin-hardware.view-model'

const setup = async (responses = {}) => {
  const context = createAdminViewModelContext(responses)
  const hook = renderHook(() => useAdminHardwareViewModel(), { wrapper: context.wrapper })
  await waitFor(() => expect(hook.result.current.hardwareTab.devices.length).toBeGreaterThan(0))
  return { ...context, ...hook }
}

describe('useAdminHardwareViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('starts with an empty summary and no devices while loading', () => {
    const { wrapper } = createAdminViewModelContext()
    const { result } = renderHook(() => useAdminHardwareViewModel(), { wrapper })
    expect(result.current.hardwareTab.summary).toEqual({ devices: 0, accelerationPercent: 0, h264HardwarePercent: 0 })
    expect(result.current.hardwareTab.devices).toEqual([])
  })

  it('maps the summary of the base', async () => {
    const { result } = await setup()
    await waitFor(() => expect(result.current.hardwareTab.summary.devices).toBe(1))
    expect(result.current.hardwareTab.summary).toEqual({
      devices: 1,
      minCores: 16,
      minMemoryGb: 8,
      accelerationPercent: 100,
      h264HardwarePercent: 100,
    })
  })

  it('merges the devices of every user, newest report first', async () => {
    const { result } = await setup({ devicesByUser: { u1: [sparseDevice, gamingDevice], u2: [] } })
    await waitFor(() => expect(result.current.hardwareTab.devices).toHaveLength(2))
    expect(result.current.hardwareTab.devices.map((device) => device.id)).toEqual(['d1', 'd2'])
    expect(result.current.hardwareTab.devices[0].user).toEqual({ id: adminUser.id, name: 'Kisnaider' })
  })

  it('opens the detail of a device with the other devices of the same user', async () => {
    const { result } = await setup({ devicesByUser: { u1: [sparseDevice, gamingDevice], u2: [] } })
    await waitFor(() => expect(result.current.hardwareTab.devices).toHaveLength(2))
    expect(result.current.deviceDialog.open).toBe(false)
    act(() => result.current.hardwareTab.onOpenDevice('d2'))
    expect(result.current.deviceDialog).toMatchObject({ open: true, userName: 'Kisnaider', currentDeviceId: 'd2' })
    expect(result.current.deviceDialog.devices).toHaveLength(2)
    act(() => result.current.deviceDialog.onDeviceChange('d1'))
    expect(result.current.deviceDialog.currentDeviceId).toBe('d1')
    act(() => result.current.deviceDialog.onOpenChange(false))
    expect(result.current.deviceDialog.open).toBe(false)
  })
})
