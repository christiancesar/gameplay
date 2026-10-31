import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@/shared/lib/auth-client', () => ({ authClient: { getSession: vi.fn() } }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { authClient } from '@/shared/lib/auth-client'
import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { fakeHttp } from '@/shared/test/fake-http'

import { usePublicRoadmapViewModel } from './use-public-roadmap.view-model'

const roadmapResponse = {
  items: [
    {
      id: 'roadmap-1',
      slug: 'community-voting',
      title: 'Community voting',
      description: 'Let the community help decide what deserves attention next.',
      status: 'next',
      position: 0,
      visibility: 'published',
      voteCount: 2,
      votedByMe: false,
      createdAt: '2026-10-30T00:00:00.000Z',
      updatedAt: '2026-10-30T00:00:00.000Z',
    },
  ],
}

const session = { user: { id: 'user-1', name: 'Ana' } }

function setup(currentSession: typeof session | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(sessionQueryOptions.queryKey, currentSession as never)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => usePublicRoadmapViewModel(), { wrapper })
}

describe('usePublicRoadmapViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeHttp.get.mockResolvedValue({ data: roadmapResponse })
    fakeHttp.post.mockResolvedValue({ data: { itemId: 'roadmap-1', voted: true, voteCount: 3 } })
    fakeHttp.delete.mockResolvedValue({ data: { itemId: 'roadmap-1', voted: false, voteCount: 2 } })
    vi.mocked(authClient.getSession).mockResolvedValue({ data: null, error: null } as never)
  })

  it('loads the roadmap for visitors and does not vote without a session', async () => {
    const { result } = setup(null)
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    act(() => result.current.onVote('roadmap-1', false))

    expect(fakeHttp.post).not.toHaveBeenCalled()
  })

  it('votes and removes the vote for an authenticated user', async () => {
    const { result } = setup(session)
    await waitFor(() => expect(result.current.items).toHaveLength(1))

    act(() => result.current.onVote('roadmap-1', false))
    await waitFor(() => expect(result.current.items[0]).toMatchObject({ voteCount: 3, votedByMe: true }))
    expect(fakeHttp.post).toHaveBeenCalledWith('/public/roadmap/roadmap-1/vote')

    act(() => result.current.onVote('roadmap-1', true))
    await waitFor(() => expect(result.current.items[0]).toMatchObject({ voteCount: 2, votedByMe: false }))
    expect(fakeHttp.delete).toHaveBeenCalledWith('/public/roadmap/roadmap-1/vote')
  })
})
