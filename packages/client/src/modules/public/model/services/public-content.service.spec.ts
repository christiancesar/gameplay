import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({ http: (await import('@/shared/test/fake-http')).fakeHttp }))

import { fakeHttp } from '@/shared/test/fake-http'

import { listPublicChangelog } from './public-content.service'

describe('public content service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the published changelog through the public API', async () => {
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
    fakeHttp.get.mockResolvedValue({ data: response })

    await expect(listPublicChangelog()).resolves.toEqual(response)
    expect(fakeHttp.get).toHaveBeenCalledWith('/public/changelog')
  })
})
