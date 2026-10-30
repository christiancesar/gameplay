import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', async () => (await import('./test/fake-router')).fakeRouterModule)
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

import { toast } from 'sonner'

import { notificationsKeys } from '@/modules/notifications/model/services/notifications.keys'
import { serversKeys } from '@/modules/servers/model/services/servers.keys'
import { ApiError } from '@/shared/lib/api-error'
import { fakeHttp } from '@/shared/test/fake-http'

import { navigate } from './test/fake-router'
import * as seed from './test/invites-seed'
import { createInvitesViewModelContext } from './test/invites-view-model-context'
import { useInviteLandingViewModel } from './use-invite-landing.view-model'

const setup = (session: object | null, invite = seed.activeInvite) => {
  const context = createInvitesViewModelContext(session, invite)
  const invalidate = vi.spyOn(context.queryClient, 'invalidateQueries')
  const hook = renderHook(() => useInviteLandingViewModel(), { wrapper: context.wrapper })
  return { ...hook, invalidate }
}

const server = { name: 'Turbex', iconUrl: undefined, memberCount: 6, isFull: false }

describe('useInviteLandingViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('has no state while the invite loads', () => {
    const { result } = setup(null)
    expect(result.current.state).toBeUndefined()
  })

  describe('without a session', () => {
    it('shows the invite', async () => {
      const { result } = setup(null)
      await waitFor(() => expect(result.current.state).toEqual({ status: 'signedOut', server }))
      expect(fakeHttp.get).toHaveBeenCalledWith('/invites/JH34SD32')
    })

    it('carries the code to sign-up and sign-in', async () => {
      const { result } = setup(null)
      await waitFor(() => expect(result.current.state).toBeDefined())
      act(() => result.current.onCreateAccount())
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-up', search: { invite: 'JH34SD32' } })
      act(() => result.current.onSignIn())
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { redirect: '/i/JH34SD32' } })
    })

    it('sends an unusable invite back to sign-in', async () => {
      const { result } = setup(null, seed.expiredInvite)
      await waitFor(() => expect(result.current.state).toEqual({ status: 'error', error: 'expired' }))
      act(() => result.current.onBackToHub())
      expect(navigate).toHaveBeenCalledWith({ to: '/sign-in' })
    })
  })

  describe('with a session', () => {
    it('asks to confirm', async () => {
      const { result } = setup(seed.session)
      await waitFor(() => expect(result.current.state).toEqual({ status: 'confirm', server, isJoining: false }))
    })

    it('flags a full server without blocking', async () => {
      const { result } = setup(seed.session, seed.fullServerInvite)
      await waitFor(() =>
        expect(result.current.state).toEqual({
          status: 'confirm',
          server: { ...server, isFull: true },
          isJoining: false,
        }),
      )
    })

    it('offers to open the server when already a member, even with an expired invite', async () => {
      const { result } = setup(seed.session, seed.expiredMemberInvite)
      await waitFor(() => expect(result.current.state).toEqual({ status: 'alreadyMember', server }))
      act(() => result.current.onOpenServer())
      expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 'srv1' } })
    })

    it('joins, refreshes servers and notifications and opens the server', async () => {
      fakeHttp.post.mockResolvedValue({ data: seed.joined })
      const { result, invalidate } = setup(seed.session)
      await waitFor(() => expect(result.current.state?.status).toBe('confirm'))
      act(() => result.current.onJoin())
      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 'srv1' } }),
      )
      expect(fakeHttp.post).toHaveBeenCalledWith('/invites/JH34SD32/join')
      expect(invalidate).toHaveBeenCalledWith({ queryKey: serversKeys.list() })
      expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
    })

    it('opens the server on already-member', async () => {
      fakeHttp.post.mockResolvedValue({ data: seed.alreadyMember })
      const { result } = setup(seed.session)
      await waitFor(() => expect(result.current.state?.status).toBe('confirm'))
      act(() => result.current.onJoin())
      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith({ to: '/servers/$serverId', params: { serverId: 'srv1' } }),
      )
    })

    it('goes back to the Hub with a toast when the request is pending', async () => {
      fakeHttp.post.mockResolvedValue({ data: seed.pending })
      const { result } = setup(seed.session)
      await waitFor(() => expect(result.current.state?.status).toBe('confirm'))
      act(() => result.current.onJoin())
      await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/hub' }))
      expect(toast.success).toHaveBeenCalledWith('invite.requestSent')
    })

    it('is joining while the request runs', async () => {
      fakeHttp.post.mockReturnValue(new Promise(() => {}))
      const { result } = setup(seed.session)
      await waitFor(() => expect(result.current.state?.status).toBe('confirm'))
      act(() => result.current.onJoin())
      await waitFor(() => expect(result.current.state).toEqual({ status: 'confirm', server, isJoining: true }))
    })

    it.each([
      ['SERVER_INVITE_EXPIRED', 'expired'],
      ['SERVER_INVITE_USED', 'exhausted'],
      ['JOIN_REQUEST_PENDING', 'requestPending'],
      ['SERVER_INVITE_REVOKED', 'notFound'],
    ])('shows %s as %s', async (apiCode, error) => {
      fakeHttp.post.mockRejectedValue(new ApiError({ code: apiCode, message: apiCode }, 409))
      const { result } = setup(seed.session)
      await waitFor(() => expect(result.current.state?.status).toBe('confirm'))
      act(() => result.current.onJoin())
      await waitFor(() => expect(result.current.state).toEqual({ status: 'error', error }))
      expect(navigate).not.toHaveBeenCalled()
    })

    it.each([
      ['used', seed.usedInvite, 'exhausted'],
      ['revoked', seed.revokedInvite, 'notFound'],
      ['unknown', seed.unknownInvite, 'notFound'],
    ])('shows a %s invite as an error and goes back to the Hub', async (_name, invite, error) => {
      const { result } = setup(seed.session, invite)
      await waitFor(() => expect(result.current.state).toEqual({ status: 'error', error }))
      act(() => result.current.onBackToHub())
      expect(navigate).toHaveBeenCalledWith({ to: '/hub' })
    })

    it('shows notFound when the invite request fails', async () => {
      const context = createInvitesViewModelContext(seed.session, seed.activeInvite)
      fakeHttp.get.mockRejectedValue(new ApiError({ code: 'NETWORK_ERROR', message: 'x' }))
      const { result } = renderHook(() => useInviteLandingViewModel(), { wrapper: context.wrapper })
      await waitFor(() => expect(result.current.state).toEqual({ status: 'error', error: 'notFound' }))
    })
  })
})
