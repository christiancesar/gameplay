import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { PlatformProvider } from './platform-provider'
import { FakePlatform } from './test/fake-platform'
import { usePlatform } from './use-platform'

describe('usePlatform', () => {
  it('answers the platform of the provider above it', () => {
    const platform = new FakePlatform({ kind: 'desktop', capabilities: { windowAudio: true } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PlatformProvider platform={platform}>{children}</PlatformProvider>
    )

    const { result } = renderHook(() => usePlatform(), { wrapper })

    expect(result.current).toBe(platform)
    expect(result.current.capabilities.windowAudio).toBe(true)
  })

  it('refuses to run without a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => renderHook(() => usePlatform())).toThrow('usePlatform needs a PlatformProvider')
    vi.restoreAllMocks()
  })
})
