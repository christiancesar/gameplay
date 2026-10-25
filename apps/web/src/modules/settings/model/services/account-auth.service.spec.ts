import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/lib/api-error'

import { fakeAccountAuthClient } from '../../view-models/test/fake-account-auth-client'

vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('../../view-models/test/fake-account-auth-client')).fakeAccountAuthClient,
}))

import { changePassword, updateUsername } from './account-auth.service'

describe('account auth service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the username and the display username together', async () => {
    fakeAccountAuthClient.updateUser.mockResolvedValue({ data: { status: true }, error: null })
    await updateUsername('Turbex')
    expect(fakeAccountAuthClient.updateUser).toHaveBeenCalledWith({ username: 'Turbex', displayUsername: 'Turbex' })
  })

  it('throws an ApiError carrying the Better Auth code', async () => {
    fakeAccountAuthClient.updateUser.mockResolvedValue({
      data: null,
      error: { code: 'USERNAME_IS_ALREADY_TAKEN', message: 'taken', status: 400 },
    })
    const failure = await updateUsername('turbex').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ code: 'USERNAME_IS_ALREADY_TAKEN', status: 400 })
  })

  it('changes the password without revoking other sessions', async () => {
    fakeAccountAuthClient.changePassword.mockResolvedValue({ data: {}, error: null })
    await changePassword({ currentPassword: 'old-pass-1', newPassword: 'new-pass-1' })
    expect(fakeAccountAuthClient.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass-1',
      newPassword: 'new-pass-1',
      revokeOtherSessions: false,
    })
  })

  it('throws when the current password is wrong', async () => {
    fakeAccountAuthClient.changePassword.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_PASSWORD', status: 400 },
    })
    await expect(changePassword({ currentPassword: 'x', newPassword: 'new-pass-1' })).rejects.toMatchObject({
      code: 'INVALID_PASSWORD',
    })
  })
})
