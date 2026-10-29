import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)

import { PlatformProvider } from '@/shared/platform/platform-provider'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { useAdminMcpViewModel } from './use-admin-mcp.view-model'

describe('useAdminMcpViewModel', () => {
  it('keeps the MCP panel unavailable until the local server exists', async () => {
    const platform = new FakePlatform({ kind: 'desktop' })
    const { result } = renderHook(() => useAdminMcpViewModel(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <PlatformProvider platform={platform}>{children}</PlatformProvider>
      ),
    })

    expect(result.current.state).toBe('unavailable')
    expect(result.current.documentation).toEqual(['admin.mcp.docs.local', 'admin.mcp.docs.future'])
    await expect(result.current.onStart()).resolves.toMatchObject({ state: 'unavailable' })
    await expect(result.current.onStop()).resolves.toMatchObject({ state: 'unavailable' })
  })
})
