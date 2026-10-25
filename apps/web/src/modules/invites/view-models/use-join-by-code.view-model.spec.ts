import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)

import { navigate } from '@/shared/test/fake-router'

import { useJoinByCodeViewModel } from './use-join-by-code.view-model'

describe('useJoinByCodeViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens the invite page for a code', () => {
    const { result } = renderHook(() => useJoinByCodeViewModel())
    act(() => result.current.onJoin('jh34sd32'))
    expect(navigate).toHaveBeenCalledWith({ to: '/i/$code', params: { code: 'JH34SD32' } })
  })

  it('opens the invite page for a whole link', () => {
    const { result } = renderHook(() => useJoinByCodeViewModel())
    act(() => result.current.onJoin('https://gameplay.example.com/i/JH34SD32'))
    expect(navigate).toHaveBeenCalledWith({ to: '/i/$code', params: { code: 'JH34SD32' } })
  })

  it('does not navigate for an invalid code', () => {
    const { result } = renderHook(() => useJoinByCodeViewModel())
    act(() => result.current.onJoin('nope'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('is never joining', () => {
    const { result } = renderHook(() => useJoinByCodeViewModel())
    expect(result.current.isJoining).toBe(false)
  })
})
