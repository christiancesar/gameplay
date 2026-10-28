import { describe, expect, it, vi } from 'vitest'

import { checkServer } from './server-health.service'

const answering = (status: number, body: unknown) =>
  vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }))

describe('checkServer', () => {
  it('asks the health route of the origin and accepts a Gameplay answer', async () => {
    const doFetch = answering(200, { status: 'ok', database: 'up' })

    expect(await checkServer('https://play.example.com', doFetch)).toBe('ok')
    expect(doFetch.mock.calls[0][0]).toBe('https://play.example.com/api/health')
  })

  it('says it is not Gameplay when something else answers', async () => {
    expect(await checkServer('https://other.example.com', answering(404, { message: 'nope' }))).toBe('notGameplay')
    expect(await checkServer('https://other.example.com', answering(200, { hello: 'world' }))).toBe('notGameplay')
    const html = vi.fn<typeof fetch>(async () => new Response('<html></html>', { status: 200 }))
    expect(await checkServer('https://other.example.com', html)).toBe('notGameplay')
  })

  it('says unreachable when nothing answers', async () => {
    const down = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await checkServer('https://play.example.com', down)).toBe('unreachable')
  })
})
