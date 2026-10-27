import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-auth-client')).fakeAuthClient,
}))
vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)

import { activeInvite } from '@/modules/invites/view-models/test/invites-seed'
import { fakeHttp } from '@/shared/test/fake-http'

import { createAuthViewModelContext } from './test/auth-view-model-context'
import { failure, okResult, signUpValues } from './test/auth-seed'
import { fakeAuthClient } from './test/fake-auth-client'
import { navigate, routerSearch } from './test/fake-router'
import { useSignUpViewModel } from './use-sign-up.view-model'

const setup = () => renderHook(() => useSignUpViewModel(), { wrapper: createAuthViewModelContext().wrapper })

describe('useSignUpViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerSearch.current = {}
    fakeAuthClient.getSession.mockResolvedValue({ data: null, error: null })
  })

  it('sends registrationKey and the account fields, then refreshes the session and goes home', async () => {
    fakeAuthClient.signUp.email.mockResolvedValue(okResult)
    const { result } = setup()
    act(() => result.current.onSubmit(signUpValues))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
    expect(fakeAuthClient.signUp.email).toHaveBeenCalledWith({
      username: signUpValues.username,
      email: signUpValues.email,
      password: signUpValues.password,
      name: signUpValues.username,
      registrationKey: signUpValues.inviteKey,
    })
    expect(fakeAuthClient.getSession.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0])
  })

  it('sends serverInviteCode when the sign-up came from an invite link', async () => {
    routerSearch.current = { invite: 'SRV123' }
    fakeAuthClient.signUp.email.mockResolvedValue(okResult)
    const { result } = setup()
    act(() => result.current.onSubmit(signUpValues))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/' }))
    expect(fakeAuthClient.signUp.email).toHaveBeenCalledWith(expect.objectContaining({ serverInviteCode: 'SRV123' }))
  })

  it.each([
    ['INVALID_REGISTRATION_KEY', 400, { inviteKey: 'inviteKeyInvalid' }],
    ['USERNAME_IS_ALREADY_TAKEN', 400, { username: 'usernameTaken' }],
    ['USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 422, { email: 'emailTaken' }],
    ['RATE_LIMITED', 429, { inviteKey: 'tooManyAttempts' }],
  ])('maps %s to a field error', async (code, status, fieldErrors) => {
    fakeAuthClient.signUp.email.mockResolvedValue(failure(code, status))
    const { result } = setup()
    act(() => result.current.onSubmit(signUpValues))
    await waitFor(() => expect(result.current.fieldErrors).toEqual(fieldErrors))
    expect(result.current.formError).toBeUndefined()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('exposes unexpected as a form error for anything else', async () => {
    fakeAuthClient.signUp.email.mockResolvedValue(failure('VALIDATION_FAILED', 400))
    const { result } = setup()
    act(() => result.current.onSubmit(signUpValues))
    await waitFor(() => expect(result.current.formError).toBe('unexpected'))
    expect(result.current.fieldErrors).toBeUndefined()
  })

  it('navigates to sign-in', () => {
    const { result } = setup()
    act(() => result.current.onSignInClick())
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-in' })
  })

  it('does not look up an invite without ?invite=', () => {
    const { result } = setup()
    expect(fakeHttp.get).not.toHaveBeenCalled()
    expect(result.current.invitedServerName).toBeUndefined()
  })

  describe('from an invite link', () => {
    beforeEach(() => {
      routerSearch.current = { invite: 'JH34SD32' }
    })

    it('resolves the name of the invited server', async () => {
      fakeHttp.get.mockResolvedValue({ data: activeInvite })
      const { result } = setup()
      await waitFor(() => expect(result.current.invitedServerName).toBe('Turbex'))
      expect(fakeHttp.get).toHaveBeenCalledWith('/invites/JH34SD32')
    })

    it('hides the name when the invite is not active', async () => {
      fakeHttp.get.mockResolvedValue({ data: { ...activeInvite, status: 'expired' } })
      const { result } = setup()
      await waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())
      expect(result.current.invitedServerName).toBeUndefined()
    })

    it('fails silently when the lookup fails', async () => {
      fakeHttp.get.mockRejectedValue(new Error('offline'))
      const { result } = setup()
      await waitFor(() => expect(fakeHttp.get).toHaveBeenCalled())
      expect(result.current.invitedServerName).toBeUndefined()
      expect(result.current.formError).toBeUndefined()
    })

    it('keeps the invite when going to sign-in', () => {
      fakeHttp.get.mockResolvedValue({ data: activeInvite })
      const { result } = setup()
      act(() => result.current.onSignInClick())
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { redirect: '/i/JH34SD32' } })
    })
  })
})
