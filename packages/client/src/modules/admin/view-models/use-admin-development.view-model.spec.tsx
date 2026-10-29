import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)

import { PlatformProvider } from '@/shared/platform/platform-provider'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { useAdminDevelopmentViewModel } from './use-admin-development.view-model'

describe('useAdminDevelopmentViewModel', () => {
  it('exposes the host diagnostics status and documentation', () => {
    const platform = new FakePlatform({ kind: 'desktop' })
    const { result } = renderHook(() => useAdminDevelopmentViewModel(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <PlatformProvider platform={platform}>{children}</PlatformProvider>
      ),
    })

    expect(result.current.status).toEqual(platform.diagnostics.status)
    expect(result.current.documentation).toEqual(['admin.development.docs.local', 'admin.development.docs.remote'])
  })
})
