import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))
vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)

import { fakeHttp } from '@/shared/test/fake-http'

import { usePublicChangelogViewModel } from './use-public-changelog.view-model'

const response = {
  entries: [
    {
      id: 'entry-1',
      slug: 'desktop-app-preview',
      version: '0.0.2',
      title: 'Desktop app gets closer',
      summary: 'A clearer path for screen sharing.',
      body: 'The desktop app is getting closer.',
      tags: ['desktop'],
      visibility: 'published',
      publishedAt: '2026-10-29T00:00:00.000Z',
      createdAt: '2026-10-29T00:00:00.000Z',
      updatedAt: '2026-10-29T00:00:00.000Z',
    },
  ],
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => usePublicChangelogViewModel(), { wrapper })
}

describe('usePublicChangelogViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fakeHttp.get.mockResolvedValue({ data: response })
  })

  it('loads entries and filters them by the search term', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.entries).toHaveLength(1))

    act(() => result.current.onSearchChange('missing'))

    expect(result.current.entries).toEqual([])
  })
})
