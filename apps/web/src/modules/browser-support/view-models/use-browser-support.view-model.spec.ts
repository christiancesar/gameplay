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

import { createDismissedNotices } from '../model/services/dismissed-notices.service'
import { createFakeStorage } from '../model/test/fake-storage'
import { chromeBrowser, firefoxBrowser, outdatedChrome, realGpu } from './test/browser-support-seed'
import { createBrowserSupportViewModelContext } from './test/browser-support-view-model-context'
import { createFakeBrowserEnvironment } from './test/fake-browser-environment'
import { useBrowserSupportViewModel } from './use-browser-support.view-model'

const setup = (browser = chromeBrowser, options: Parameters<typeof createBrowserSupportViewModelContext>[0] = {}) => {
  const { storage } = createFakeStorage()
  fakes.dismissed = createDismissedNotices(() => storage)
  fakes.environment = createFakeBrowserEnvironment({ browser, gpu: realGpu, publicIps: [] }).environment
  const { wrapper } = createBrowserSupportViewModelContext(options)
  return { storage, ...renderHook(() => useBrowserSupportViewModel(), { wrapper }) }
}

describe('useBrowserSupportViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has no status for a current Chromium', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.status).toBeNull())
  })

  it('flags a browser that is not Chromium', () => {
    const { result } = setup(firefoxBrowser)
    expect(result.current.status).toEqual({ type: 'unsupported', browser: { name: 'Firefox', version: '144.0' } })
  })

  it('flags an outdated Chromium once the minimum arrives', async () => {
    const { result } = setup(outdatedChrome)
    await waitFor(() =>
      expect(result.current.status).toEqual({
        type: 'outdated',
        browser: { name: 'Chrome', version: '109' },
        minVersion: 130,
      }),
    )
  })

  it('still flags an unsupported browser when the settings request fails', async () => {
    const { result } = setup(firefoxBrowser, { minChromiumVersion: null })
    await waitFor(() => expect(result.current.status?.type).toBe('unsupported'))
  })

  it('hides after dismissing and stays hidden in a new mount of the same session', () => {
    const { result, storage } = setup(firefoxBrowser)
    act(() => result.current.onDismiss())
    expect(result.current.status).toBeNull()

    fakes.dismissed = createDismissedNotices(() => storage)
    const { result: next } = renderHook(() => useBrowserSupportViewModel(), {
      wrapper: createBrowserSupportViewModelContext().wrapper,
    })
    expect(next.current.status).toBeNull()
  })
})
