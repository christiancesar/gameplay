import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConnectionStore } from '@/modules/realtime/view-models/stores/connection.store'

import { useConnectionBannerViewModel } from './use-connection-banner.view-model'

describe('useConnectionBannerViewModel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useConnectionStore.getState().reset()
  })
  afterEach(() => vi.useRealTimers())

  it('is online (hidden) while connected or not connected at all', () => {
    const { result } = renderHook(() => useConnectionBannerViewModel())
    expect(result.current.status).toBe('online')
    act(() => useConnectionStore.getState().setStatus('connected'))
    expect(result.current.status).toBe('online')
  })

  it('shows reconnecting, then reconnected for a moment, then hides', () => {
    const { result } = renderHook(() => useConnectionBannerViewModel())
    act(() => useConnectionStore.getState().setStatus('connected'))
    act(() => useConnectionStore.getState().setStatus('reconnecting'))
    expect(result.current.status).toBe('reconnecting')
    act(() => useConnectionStore.getState().setStatus('connected'))
    expect(result.current.status).toBe('reconnected')
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.status).toBe('online')
  })
})
