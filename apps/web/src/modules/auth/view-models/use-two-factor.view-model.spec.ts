import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-auth-client')).fakeAuthClient,
}))
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)

import { usePendingTwoFactorStore } from './stores/pending-two-factor.store'
import { createAuthViewModelContext } from './test/auth-view-model-context'
import { failure, okResult } from './test/auth-seed'
import { fakeAuthClient } from './test/fake-auth-client'
import { navigate, routerSearch } from './test/fake-router'
import { useTwoFactorViewModel } from './use-two-factor.view-model'

const setup = () => renderHook(() => useTwoFactorViewModel(), { wrapper: createAuthViewModelContext().wrapper })
const values = { code: '123456' }

describe('useTwoFactorViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerSearch.current = { step: 'two-factor' }
    usePendingTwoFactorStore.setState({ pending: true })
    fakeAuthClient.getSession.mockResolvedValue({ data: null, error: null })
  })

  it('goes back to /sign-in with replace when no login is pending', async () => {
    usePendingTwoFactorStore.setState({ pending: false })
    setup()
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { redirect: undefined }, replace: true }),
    )
  })

  it('stays when a login is pending', () => {
    setup()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('verifies, refreshes the session, navigates to the safe redirect and clears the flag', async () => {
    routerSearch.current = { step: 'two-factor', redirect: '/i/ABC123' }
    fakeAuthClient.twoFactor.verifyTotp.mockResolvedValue(okResult)
    const { result } = setup()
    act(() => result.current.onSubmit(values))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/i/ABC123' }))
    expect(fakeAuthClient.twoFactor.verifyTotp).toHaveBeenCalledWith(values)
    expect(fakeAuthClient.getSession.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0])
    await waitFor(() => expect(usePendingTwoFactorStore.getState().pending).toBe(false))
  })

  it('falls back to / for an open redirect', async () => {
    routerSearch.current = { step: 'two-factor', redirect: '//evil.com' }
    fakeAuthClient.twoFactor.verifyTotp.mockResolvedValue(okResult)
    const { result } = setup()
    act(() => result.current.onSubmit(values))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
  })

  it('exposes invalidTwoFactorCode for a wrong code', async () => {
    fakeAuthClient.twoFactor.verifyTotp.mockResolvedValue(failure('INVALID_CODE', 401))
    const { result } = setup()
    act(() => result.current.onSubmit(values))
    await waitFor(() => expect(result.current.formError).toBe('invalidTwoFactorCode'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('exposes tooManyAttempts on 429', async () => {
    fakeAuthClient.twoFactor.verifyTotp.mockResolvedValue(failure('RATE_LIMITED', 429))
    const { result } = setup()
    act(() => result.current.onSubmit(values))
    await waitFor(() => expect(result.current.formError).toBe('tooManyAttempts'))
  })

  it('returns to the credentials step when the 2FA cookie is gone', async () => {
    fakeAuthClient.twoFactor.verifyTotp.mockResolvedValue(failure('INVALID_TWO_FACTOR_COOKIE', 401))
    const { result } = setup()
    act(() => result.current.onSubmit(values))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { redirect: undefined }, replace: true }),
    )
    expect(usePendingTwoFactorStore.getState().pending).toBe(false)
  })

  it('onBack clears the flag and returns to the credentials step', () => {
    const { result } = setup()
    act(() => result.current.onBack())
    expect(usePendingTwoFactorStore.getState().pending).toBe(false)
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { redirect: undefined }, replace: true })
  })

  it('onUseRecoveryCodeClick switches step keeping the flag', () => {
    const { result } = setup()
    act(() => result.current.onUseRecoveryCodeClick())
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { step: 'recovery-code', redirect: undefined } })
    expect(usePendingTwoFactorStore.getState().pending).toBe(true)
  })
})
