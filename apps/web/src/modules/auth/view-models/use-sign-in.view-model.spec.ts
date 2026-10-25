import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-auth-client')).fakeAuthClient,
}))
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)

import { usePendingTwoFactorStore } from './stores/pending-two-factor.store'
import { createAuthViewModelContext } from './test/auth-view-model-context'
import { credentialsByEmail, credentialsByUsername, failure, signedInResult, twoFactorResult } from './test/auth-seed'
import { fakeAuthClient } from './test/fake-auth-client'
import { navigate, routerSearch } from './test/fake-router'
import { useSignInViewModel } from './use-sign-in.view-model'

const setup = () => renderHook(() => useSignInViewModel(), { wrapper: createAuthViewModelContext().wrapper })

describe('useSignInViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerSearch.current = {}
    usePendingTwoFactorStore.setState({ pending: false })
    fakeAuthClient.getSession.mockResolvedValue({ data: null, error: null })
  })

  it('signs in by email, refreshes the session and then navigates home', async () => {
    fakeAuthClient.signIn.email.mockResolvedValue(signedInResult)
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
    expect(fakeAuthClient.signIn.email).toHaveBeenCalledWith({
      email: credentialsByEmail.identifier,
      password: credentialsByEmail.password,
    })
    expect(fakeAuthClient.getSession.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0])
  })

  it('signs in by username when the identifier has no @', async () => {
    fakeAuthClient.signIn.username.mockResolvedValue(signedInResult)
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByUsername))
    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(fakeAuthClient.signIn.username).toHaveBeenCalledWith({
      username: credentialsByUsername.identifier,
      password: credentialsByUsername.password,
    })
  })

  it('goes to the safe redirect', async () => {
    routerSearch.current = { redirect: '/i/ABC123' }
    fakeAuthClient.signIn.email.mockResolvedValue(signedInResult)
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/i/ABC123' }))
  })

  it('ignores an open redirect', async () => {
    routerSearch.current = { redirect: '//evil.com' }
    fakeAuthClient.signIn.email.mockResolvedValue(signedInResult)
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
  })

  it('moves to the two-factor step when Better Auth asks for it', async () => {
    routerSearch.current = { redirect: '/i/ABC123' }
    fakeAuthClient.signIn.email.mockResolvedValue(twoFactorResult)
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { step: 'two-factor', redirect: '/i/ABC123' } }),
    )
    expect(usePendingTwoFactorStore.getState().pending).toBe(true)
    expect(fakeAuthClient.getSession).not.toHaveBeenCalled()
  })

  it('exposes invalidCredentials and does not navigate', async () => {
    fakeAuthClient.signIn.email.mockResolvedValue(failure('INVALID_EMAIL_OR_PASSWORD', 401))
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() => expect(result.current.formError).toBe('invalidCredentials'))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('exposes accountSuspended for a banned user', async () => {
    fakeAuthClient.signIn.email.mockResolvedValue(failure('BANNED_USER', 403))
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() => expect(result.current.formError).toBe('accountSuspended'))
  })

  it('exposes tooManyAttempts on 429', async () => {
    fakeAuthClient.signIn.username.mockResolvedValue(failure('RATE_LIMITED', 429))
    const { result } = setup()
    act(() => result.current.onSubmit(credentialsByUsername))
    await waitFor(() => expect(result.current.formError).toBe('tooManyAttempts'))
  })

  it('is submitting while the request runs', async () => {
    let finish: (value: typeof signedInResult) => void = () => {}
    fakeAuthClient.signIn.email.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    const { result } = setup()
    expect(result.current.isSubmitting).toBe(false)
    act(() => result.current.onSubmit(credentialsByEmail))
    await waitFor(() => expect(result.current.isSubmitting).toBe(true))
    finish(signedInResult)
    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })

  it('navigates to sign-up', () => {
    const { result } = setup()
    act(() => result.current.onSignUpClick())
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-up' })
  })
})
