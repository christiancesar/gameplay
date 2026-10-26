import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))

import { fakeHttp } from '@/shared/test/fake-http'

import { getPublicSettings } from './public-settings.service'

describe('getPublicSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads the minimum Chromium version from the public route', async () => {
    fakeHttp.get.mockResolvedValue({ data: { minChromiumVersion: 130 } })
    await expect(getPublicSettings()).resolves.toEqual({ minChromiumVersion: 130 })
    expect(fakeHttp.get).toHaveBeenCalledWith('/settings/public')
  })

  it('rejects an unexpected shape', async () => {
    fakeHttp.get.mockResolvedValue({ data: { minChromiumVersion: 'x' } })
    await expect(getPublicSettings()).rejects.toThrow()
  })
})
