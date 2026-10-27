import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fakes } from './test/browser-support-mocks'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@/modules/browser-support/model/services/browser-environment.service', () => ({
  browserEnvironment: new Proxy({}, { get: (_target, key) => (fakes.environment as never)[key] }),
}))
vi.mock('@/modules/browser-support/model/services/dismissed-notices.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/browser-support/model/services/dismissed-notices.service')>()),
  dismissedNotices: new Proxy({}, { get: (_target, key) => (fakes.dismissed as never)[key] }),
}))
vi.mock('@/modules/hardware/model/services/displays.service', () => ({
  displays: new Proxy({}, { get: (_target, key) => (fakes.displays as never)[key] }),
}))
vi.mock('@/modules/hardware/model/services/device-reporter.service', () => ({
  deviceReporter: new Proxy({}, { get: (_target, key) => (fakes.reporter as never)[key] }),
}))

import { createFakeDeviceReporter } from '@/modules/hardware/view-models/test/fake-device-reporter'
import { createFakeDisplays } from '@/modules/hardware/view-models/test/fake-displays'

import { createDismissedNotices } from '../model/services/dismissed-notices.service'
import { createFakeStorage } from '../model/test/fake-storage'
import { chromeBrowser, firefoxBrowser, iceConfig, realGpu, softwareGpu } from './test/browser-support-seed'
import { createBrowserSupportViewModelContext } from './test/browser-support-view-model-context'
import { createFakeBrowserEnvironment } from './test/fake-browser-environment'
import { useEnvironmentNoticesViewModel } from './use-environment-notices.view-model'

type Options = {
  browser?: typeof chromeBrowser
  gpu?: typeof realGpu
  publicIps?: string[]
  permission?: 'granted' | 'prompt' | 'denied' | 'unsupported'
  ice?: typeof iceConfig | null
}

const setup = (options: Options = {}) => {
  const { browser = chromeBrowser, gpu = realGpu, publicIps = [iceConfig.requestIp], permission = 'granted' } = options
  const { storage } = createFakeStorage()
  fakes.dismissed = createDismissedNotices(() => storage)
  const env = createFakeBrowserEnvironment({ browser, gpu, publicIps })
  fakes.environment = env.environment
  const displays = createFakeDisplays(permission)
  fakes.displays = displays.service
  const reporter = createFakeDeviceReporter()
  fakes.reporter = reporter
  const context = createBrowserSupportViewModelContext({ ice: options.ice })
  const hook = renderHook(() => useEnvironmentNoticesViewModel(), { wrapper: context.wrapper })
  return { env, displays, reporter, storage, ...context, ...hook }
}

const types = (notices: { type: string }[]) => notices.map((notice) => notice.type)

describe('useEnvironmentNoticesViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has no notices in a healthy environment', async () => {
    const { result, env } = setup()
    await waitFor(() => expect(env.environment.gatherPublicIps).toHaveBeenCalled())
    expect(result.current.notices).toEqual([])
  })

  it('says nothing about the browser: any browser is fine', async () => {
    const { result, env } = setup({ browser: firefoxBrowser })
    await waitFor(() => expect(env.environment.gatherPublicIps).toHaveBeenCalled())
    expect(result.current.notices).toEqual([])
  })

  it('shows the acceleration notice for a software renderer', () => {
    const { result } = setup({ gpu: softwareGpu })
    expect(types(result.current.notices)).toEqual(['accelerationOff'])
  })

  it('shows the VPN notice when STUN sees another address than the API', async () => {
    const { result, env } = setup({ publicIps: ['198.51.100.9'] })
    await waitFor(() => expect(types(result.current.notices)).toEqual(['vpn']))
    expect(env.environment.gatherPublicIps).toHaveBeenCalledWith(iceConfig.iceServers)
  })

  it('does not warn about a VPN for an IPv6 only STUN answer', async () => {
    const { result, env } = setup({ publicIps: ['2001:db8::7'] })
    await waitFor(() => expect(env.environment.gatherPublicIps).toHaveBeenCalled())
    expect(result.current.notices).toEqual([])
  })

  it('does not warn about a VPN when STUN found nothing', async () => {
    const { result, env } = setup({ publicIps: [] })
    await waitFor(() => expect(env.environment.gatherPublicIps).toHaveBeenCalled())
    expect(result.current.notices).toEqual([])
  })

  it('does not probe STUN when the ICE config fails', async () => {
    const { result, env, queryClient } = setup({ ice: null })
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(env.environment.gatherPublicIps).not.toHaveBeenCalled()
    expect(result.current.notices).toEqual([])
  })

  it('asks for the monitors permission only while it is promptable', async () => {
    const { result } = setup({ permission: 'prompt' })
    await waitFor(() => expect(types(result.current.notices)).toEqual(['monitorsPermission']))
  })

  it('allowing the monitors requests the permission, reports again and removes the notice', async () => {
    const { result, displays, reporter } = setup({ permission: 'prompt' })
    await waitFor(() => expect(result.current.notices).toHaveLength(1))
    await act(() => result.current.allowMonitors())
    expect(displays.service.request).toHaveBeenCalled()
    expect(reporter.report).toHaveBeenCalledWith({ withDisplays: true })
    expect(result.current.notices).toEqual([])
  })

  it('drops the notice without reporting when the monitors permission is denied', async () => {
    const { result, displays, reporter } = setup({ permission: 'prompt' })
    displays.state.requestResult = 'denied'
    await waitFor(() => expect(result.current.notices).toHaveLength(1))
    await act(() => result.current.allowMonitors())
    expect(reporter.report).not.toHaveBeenCalled()
    expect(result.current.notices).toEqual([])
  })

  it('dismisses one notice for the session', async () => {
    const { result, storage } = setup({ gpu: softwareGpu, permission: 'prompt' })
    await waitFor(() => expect(result.current.notices).toHaveLength(2))
    expect(result.current.isEnvironmentNotice('env:acceleration')).toBe(true)
    expect(result.current.isEnvironmentNotice('server-1')).toBe(false)
    act(() => result.current.dismiss('env:acceleration'))
    expect(types(result.current.notices)).toEqual(['monitorsPermission'])
    expect(createDismissedNotices(() => storage).isDismissed('acceleration')).toBe(true)
  })

  it('dismisses all of them', async () => {
    const { result } = setup({ gpu: softwareGpu, permission: 'prompt' })
    await waitFor(() => expect(result.current.notices).toHaveLength(2))
    act(() => result.current.dismissAll())
    expect(result.current.notices).toEqual([])
  })
})
