import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/auth-client', async () => ({
  authClient: (await import('./test/fake-two-factor-client')).fakeTwoFactorClient,
}))
vi.mock('qrcode', async () => (await import('./test/fake-qrcode')).fakeQrCodeModule)
vi.mock('@tanstack/react-router', async () => (await import('@/shared/test/fake-router')).fakeRouterModule)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock(
  '@/modules/admin/model/services/browser.service',
  async () => (await import('./test/fake-browser')).fakeBrowserModule,
)

import { toast } from 'sonner'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { navigate } from '@/shared/test/fake-router'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { enrollmentResult, failure, okResult } from './test/two-factor-seed'
import { fakeBrowserModule } from './test/fake-browser'
import { fakeTwoFactorClient } from './test/fake-two-factor-client'
import { useAdminTwoFactorSetupViewModel } from './use-admin-two-factor-setup.view-model'

const setup = () => {
  const context = createQueryClientContext()
  context.queryClient.setQueryDefaults(sessionQueryOptions.queryKey, {
    queryFn: async () => (await fakeTwoFactorClient.getSession()).data,
  })
  context.queryClient.setQueryData(sessionQueryOptions.queryKey, null)
  return { ...context, ...renderHook(() => useAdminTwoFactorSetupViewModel(), { wrapper: context.wrapper }) }
}

const enroll = async (hook: ReturnType<typeof setup>) => {
  act(() => hook.result.current.onConfirmPassword({ password: 'admin-pass-123' }))
  await waitFor(() => expect(hook.result.current.state.step).toBe('scan'))
}

describe('useAdminTwoFactorSetupViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeTwoFactorClient.twoFactor.enable.mockResolvedValue(enrollmentResult)
    fakeTwoFactorClient.twoFactor.verifyTotp.mockResolvedValue(okResult)
    fakeTwoFactorClient.getSession.mockResolvedValue({ data: { user: { twoFactorEnabled: true } }, error: null })
  })

  it('starts asking for the password', () => {
    const { result } = setup()
    expect(result.current.state).toEqual({ step: 'password', isSubmitting: false, invalidPassword: false })
  })

  it('moves to the QR step with the QR image and the typed secret', async () => {
    const hook = setup()
    await enroll(hook)
    expect(fakeTwoFactorClient.twoFactor.enable).toHaveBeenCalledWith({ password: 'admin-pass-123' })
    expect(hook.result.current.state).toMatchObject({
      step: 'scan',
      qrCodeUrl: expect.stringContaining('data:image/png;qr,'),
      secret: 'MFTHG5BUOJYXKYLQ',
      isVerifying: false,
      invalidCode: false,
    })
  })

  it('flags a wrong password on the password step', async () => {
    fakeTwoFactorClient.twoFactor.enable.mockResolvedValue(failure('INVALID_PASSWORD', 400))
    const { result } = setup()
    act(() => result.current.onConfirmPassword({ password: 'nope' }))
    await waitFor(() => expect(result.current.state).toMatchObject({ step: 'password', invalidPassword: true }))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows a toast for the rate limit', async () => {
    fakeTwoFactorClient.twoFactor.enable.mockResolvedValue(failure('TOO_MANY_REQUESTS', 429))
    const { result } = setup()
    act(() => result.current.onConfirmPassword({ password: 'x' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('auth.errors.tooManyAttempts'))
    expect(result.current.state).toMatchObject({ step: 'password', invalidPassword: false })
  })

  it('flags a wrong code and keeps the QR step', async () => {
    const hook = setup()
    await enroll(hook)
    fakeTwoFactorClient.twoFactor.verifyTotp.mockResolvedValue(failure('INVALID_CODE', 401))
    act(() => hook.result.current.onVerify({ code: '000000' }))
    await waitFor(() => expect(hook.result.current.state).toMatchObject({ step: 'scan', invalidCode: true }))
  })

  it('shows the recovery codes only after the code is verified', async () => {
    const hook = setup()
    await enroll(hook)
    act(() => hook.result.current.onVerify({ code: '123456' }))
    await waitFor(() => expect(hook.result.current.state.step).toBe('recovery'))
    expect(fakeTwoFactorClient.twoFactor.verifyTotp).toHaveBeenCalledWith({ code: '123456' })
    expect(hook.result.current.state).toEqual({
      step: 'recovery',
      recoveryCodes: enrollmentResult.data.backupCodes,
      copied: false,
    })
  })

  it('copies and downloads the recovery codes', async () => {
    const hook = setup()
    await enroll(hook)
    act(() => hook.result.current.onVerify({ code: '123456' }))
    await waitFor(() => expect(hook.result.current.state.step).toBe('recovery'))
    const text = enrollmentResult.data.backupCodes.join('\n')
    act(() => hook.result.current.onCopyCodes())
    await waitFor(() => expect(hook.result.current.state).toMatchObject({ copied: true }))
    expect(fakeBrowserModule.copyText).toHaveBeenCalledWith(text)
    act(() => hook.result.current.onDownloadCodes())
    expect(fakeBrowserModule.downloadTextFile).toHaveBeenCalledWith('gameplay-recovery-codes.txt', text)
  })

  it('refreshes the session and then opens the panel', async () => {
    const hook = setup()
    await act(() => hook.result.current.onFinish())
    expect(fakeTwoFactorClient.getSession).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({ to: '/admin/users' })
    expect(fakeTwoFactorClient.getSession.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0],
    )
  })
})
