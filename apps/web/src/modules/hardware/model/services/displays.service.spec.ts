import { describe, expect, it, vi } from 'vitest'

import { createDisplaysService, type DisplaysEnv } from './displays.service'

const screens = [{ width: 1920, height: 1080, devicePixelRatio: 1 }]

const env = (overrides: Partial<DisplaysEnv> = {}): DisplaysEnv => ({
  permissions: { query: vi.fn(async () => ({ state: 'prompt' as const })) },
  getScreenDetails: vi.fn(async () => ({ screens })),
  ...overrides,
})

describe('displays service', () => {
  it('is unsupported without getScreenDetails', async () => {
    const service = createDisplaysService({})
    await expect(service.permission()).resolves.toBe('unsupported')
    await expect(service.request()).resolves.toBe('unsupported')
  })

  it('reads the permission state', async () => {
    const granted = env({ permissions: { query: vi.fn(async () => ({ state: 'granted' as const })) } })
    await expect(createDisplaysService(granted).permission()).resolves.toBe('granted')
  })

  it('tries the older permission name when the new one is unknown', async () => {
    const query = vi.fn(async ({ name }: { name: string }) => {
      if (name === 'window-management') throw new TypeError('unknown permission')
      return { state: 'denied' as const }
    })
    await expect(createDisplaysService(env({ permissions: { query } })).permission()).resolves.toBe('denied')
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('asks again (prompt) when no name is known', async () => {
    const query = vi.fn(async () => {
      throw new TypeError('unknown permission')
    })
    await expect(createDisplaysService(env({ permissions: { query } })).permission()).resolves.toBe('prompt')
  })

  it('grants on a successful request and denies on a refusal', async () => {
    await expect(createDisplaysService(env()).request()).resolves.toBe('granted')
    const refused = env({
      getScreenDetails: vi.fn(async () => Promise.reject(new DOMException('no', 'NotAllowedError'))),
    })
    await expect(createDisplaysService(refused).request()).resolves.toBe('denied')
  })

  it('reads the screens', async () => {
    await expect(createDisplaysService(env()).readScreens()).resolves.toEqual(screens)
    await expect(createDisplaysService({}).readScreens()).resolves.toEqual([])
  })
})
