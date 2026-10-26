import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fakes = vi.hoisted(() => ({ reporter: undefined as unknown, displays: undefined as unknown }))

vi.mock('@/modules/hardware/model/services/device-reporter.service', () => ({
  deviceReporter: new Proxy({}, { get: (_target, key) => (fakes.reporter as never)[key] }),
}))
vi.mock('@/modules/hardware/model/services/displays.service', () => ({
  displays: new Proxy({}, { get: (_target, key) => (fakes.displays as never)[key] }),
}))

import { createQueryClientContext } from '@/shared/test/query-client-context'

import { createFakeDeviceReporter } from './test/fake-device-reporter'
import { createFakeDisplays } from './test/fake-displays'
import { useAutoReportHardwareViewModel } from './use-auto-report-hardware.view-model'

const setup = (session: unknown, permission: 'granted' | 'prompt' = 'prompt') => {
  const context = createQueryClientContext()
  context.queryClient.setQueryData(['session'], session)
  const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
  const reporter = createFakeDeviceReporter()
  fakes.reporter = reporter
  fakes.displays = createFakeDisplays(permission).service
  const hook = renderHook(() => useAutoReportHardwareViewModel(), { wrapper: context.wrapper })
  return { reporter, invalidate, ...hook }
}

const session = (id: string) => ({ session: { id: 's' }, user: { id } })

describe('useAutoReportHardwareViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reports the device once the user is signed in and refreshes the list', async () => {
    const { reporter, invalidate } = setup(session('u1'))
    await waitFor(() => expect(reporter.report).toHaveBeenCalledWith({ withDisplays: false }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['hardware', 'devices'] }))
  })

  it('reads the monitors only when the permission was already granted', async () => {
    const { reporter } = setup(session('u1'), 'granted')
    await waitFor(() => expect(reporter.report).toHaveBeenCalledWith({ withDisplays: true }))
  })

  it('does nothing without a session', async () => {
    const { reporter } = setup(null)
    await Promise.resolve()
    expect(reporter.report).not.toHaveBeenCalled()
  })

  it('reports once per user, not on every render', async () => {
    const { reporter, rerender } = setup(session('u1'))
    await waitFor(() => expect(reporter.report).toHaveBeenCalledTimes(1))
    rerender()
    expect(reporter.report).toHaveBeenCalledTimes(1)
  })

  it('swallows a failed report', async () => {
    const context = createQueryClientContext()
    context.queryClient.setQueryData(['session'], session('u1'))
    const reporter = createFakeDeviceReporter()
    vi.mocked(reporter.report).mockRejectedValue(new Error('offline'))
    fakes.reporter = reporter
    fakes.displays = createFakeDisplays().service
    renderHook(() => useAutoReportHardwareViewModel(), { wrapper: context.wrapper })
    await waitFor(() => expect(reporter.report).toHaveBeenCalled())
  })
})
