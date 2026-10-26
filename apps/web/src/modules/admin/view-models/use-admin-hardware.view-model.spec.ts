import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))

import { createAdminViewModelContext } from './test/admin-view-model-context'
import { adminGamingDevice, adminSparseDevice } from './test/device-seed'
import { fakeHttp } from '@/shared/test/fake-http'
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

  it('lists the devices from the global endpoint, newest report first, without a per-user merge', async () => {
    const { result } = await setup({ devices: [adminGamingDevice, adminSparseDevice] })
    await waitFor(() => expect(result.current.hardwareTab.devices).toHaveLength(2))
    expect(fakeHttp.get).toHaveBeenCalledWith('/admin/hardware/devices', { params: { pageSize: 100 } })
    expect(fakeHttp.get).not.toHaveBeenCalledWith('/admin/users/u1/devices')
    expect(result.current.hardwareTab.devices.map((device) => device.id)).toEqual([
      'u1:5b0c8a3e-2f4a-4b8e-9f3a-111111111111',
      'u1:5b0c8a3e-2f4a-4b8e-9f3a-222222222222',
    ])
    expect(result.current.hardwareTab.devices[0].user).toEqual({ id: 'u1', name: 'kisnaider' })
  })

  it('opens the detail of a device with the other devices of the same user', async () => {
    const { result } = await setup({ devices: [adminGamingDevice, adminSparseDevice] })
    await waitFor(() => expect(result.current.hardwareTab.devices).toHaveLength(2))
    const [first, second] = result.current.hardwareTab.devices
    expect(result.current.deviceDialog.open).toBe(false)
    act(() => result.current.hardwareTab.onOpenDevice(second.id))
    expect(result.current.deviceDialog).toMatchObject({ open: true, userName: 'kisnaider', currentDeviceId: second.id })
    expect(result.current.deviceDialog.devices).toHaveLength(2)
    act(() => result.current.deviceDialog.onDeviceChange(first.id))
    expect(result.current.deviceDialog.currentDeviceId).toBe(first.id)
    act(() => result.current.deviceDialog.onOpenChange(false))
    expect(result.current.deviceDialog.open).toBe(false)
  })
})
