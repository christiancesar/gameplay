import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakes = vi.hoisted(() => ({ reporter: undefined as unknown, displays: undefined as unknown }))

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
vi.mock('@/modules/hardware/model/services/device-reporter.service', () => ({
  deviceReporter: new Proxy({}, { get: (_target, key) => (fakes.reporter as never)[key] }),
}))
vi.mock('@/modules/hardware/model/services/displays.service', () => ({
  displays: new Proxy({}, { get: (_target, key) => (fakes.displays as never)[key] }),
}))

import { toast } from 'sonner'

import { fakeHttp } from '@/shared/test/fake-http'

import { createFakeDeviceReporter } from './test/fake-device-reporter'
import { createFakeDisplays } from './test/fake-displays'
import { DEVICE_ID, deviceReport, manualReport } from './test/hardware-seed'
import { createHardwareViewModelContext } from './test/hardware-view-model-context'
import { useHardwareSettingsViewModel } from './use-hardware-settings.view-model'

const setup = (devices = [deviceReport], permission: 'granted' | 'prompt' | 'denied' | 'unsupported' = 'prompt') => {
  const context = createHardwareViewModelContext(devices)
  const reporter = createFakeDeviceReporter()
  const fakeDisplays = createFakeDisplays(permission)
  fakes.reporter = reporter
  fakes.displays = fakeDisplays.service
  return {
    reporter,
    fakeDisplays,
    ...context,
    ...renderHook(() => useHardwareSettingsViewModel(), { wrapper: context.wrapper }),
  }
}

describe('useHardwareSettingsViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the stored report of this device', async () => {
    const { result, reporter } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    expect(result.current.hardware?.browser).toEqual({ name: 'Google Chrome', version: '141' })
    expect(result.current.lastSentAt).toBe(deviceReport.collectedAt)
    expect(result.current.displaysPermission).toBe('prompt')
    expect(reporter.report).not.toHaveBeenCalled()
  })

  it('ignores reports of other devices', async () => {
    const other = { ...deviceReport, deviceId: '0c9d2a8b-3f4e-4a6b-8d7c-1e2f3a4b5c6d' }
    const { result, reporter } = setup([other])
    await waitFor(() => expect(reporter.report).toHaveBeenCalledWith({ withDisplays: false }))
    await waitFor(() => expect(result.current.hardware).toBeDefined())
  })

  it('collects this device on its own when it never reported', async () => {
    const { result, reporter } = setup([])
    await waitFor(() => expect(reporter.report).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    expect(reporter.report).toHaveBeenCalledTimes(1)
  })

  it('collects again on demand, with monitors only when the permission is granted', async () => {
    const { result, reporter } = setup([deviceReport], 'granted')
    await waitFor(() => expect(result.current.displaysPermission).toBe('granted'))
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    act(() => result.current.onRefresh())
    await waitFor(() => expect(reporter.report).toHaveBeenCalledWith({ withDisplays: true }))
  })

  it('collects without monitors when the permission is not granted', async () => {
    const { result, reporter } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    act(() => result.current.onRefresh())
    await waitFor(() => expect(reporter.report).toHaveBeenCalledWith({ withDisplays: false }))
  })

  it('asks for the monitors and collects again once allowed', async () => {
    const { result, reporter } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    await act(() => result.current.onAllowDisplays())
    expect(result.current.displaysPermission).toBe('granted')
    await waitFor(() => expect(reporter.report).toHaveBeenCalledWith({ withDisplays: true }))
  })

  it('keeps the denied state and does not collect when the monitors are refused', async () => {
    const { result, reporter, fakeDisplays } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    fakeDisplays.state.requestResult = 'denied'
    await act(() => result.current.onAllowDisplays())
    expect(result.current.displaysPermission).toBe('denied')
    expect(reporter.report).not.toHaveBeenCalled()
  })

  it('shows the new report after collecting again', async () => {
    const { result, reporter } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    vi.mocked(reporter.report).mockResolvedValue({ ...deviceReport, collectedAt: '2026-10-26T08:00:00.000Z' })
    act(() => result.current.onRefresh())
    await waitFor(() => expect(result.current.lastSentAt).toBe('2026-10-26T08:00:00.000Z'))
  })

  it('warns when collecting fails', async () => {
    const { result, reporter } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    vi.mocked(reporter.report).mockRejectedValue(new Error('boom'))
    act(() => result.current.onRefresh())
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('hardware.errors.collect'))
  })

  it('prefills the form with the saved manual data', async () => {
    const { result } = setup([manualReport])
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    expect(result.current.defaultManual).toMatchObject({ cpuModel: 'Ryzen 7 5800X', ramGb: '32', connection: 'wired' })
    expect(result.current.hardware?.userProvided?.cpuModel).toBe('Ryzen 7 5800X')
  })

  it('saves the manual data and shows it', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    fakeHttp.put.mockResolvedValue({ data: manualReport })
    act(() =>
      result.current.onSaveManual({
        cpuModel: 'Ryzen 7 5800X',
        ramGb: 32,
        gpuModel: undefined,
        vramGb: 8,
        connection: 'wired',
        downloadMbps: 500,
        uploadMbps: undefined,
      }),
    )
    await waitFor(() => expect(result.current.manualSaved).toBe(true))
    expect(fakeHttp.put).toHaveBeenCalledWith(`/me/devices/${DEVICE_ID}/manual`, manualReport.manual)
    expect(result.current.hardware?.userProvided?.ramGb).toBe(32)
  })

  it('warns when saving the manual data fails', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.hardware).toBeDefined())
    fakeHttp.put.mockRejectedValue(new Error('boom'))
    act(() => result.current.onSaveManual({ cpuModel: 'x' } as never))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('hardware.errors.saveManual'))
    expect(result.current.manualSaved).toBe(false)
  })
})
