import { NotFoundException } from '@nestjs/common'
import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EnvService } from '../../../env/env.service'
import { WindowsUpdatesController } from './windows-updates.controller'

function controller(feedBaseUrl = 'https://bucket.example.com/gameplay/windows') {
  const env = { get: () => feedBaseUrl } as unknown as EnvService
  return new WindowsUpdatesController(env)
}

describe('WindowsUpdatesController', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('proxies the stable feed without exposing the object storage URL', async () => {
    const responseBody = new ReadableStream({
      start: (stream) => {
        stream.enqueue(new TextEncoder().encode('feed'))
        stream.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(responseBody, { headers: { 'content-type': 'text/plain' } })),
    )
    const response = Object.assign(new PassThrough(), {
      setHeader: vi.fn(),
      status: vi.fn(() => response),
    })
    const chunks: Buffer[] = []
    response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    const result = controller().artifact('stable', 'RELEASES', response as never)

    await result
    await new Promise<void>((resolve) => response.on('end', resolve))

    const requestedUrl = vi.mocked(fetch).mock.calls[0]?.[0]
    expect(requestedUrl).toBeInstanceOf(URL)
    expect((requestedUrl as URL).href).toBe('https://bucket.example.com/gameplay/windows/stable/RELEASES')
    expect(Buffer.concat(chunks).toString()).toBe('feed')
  })

  it('rejects unconfigured channels and unsafe artifact names', async () => {
    const response = Object.assign(new PassThrough(), {
      setHeader: vi.fn(),
      status: vi.fn(() => response),
    })

    await expect(controller().artifact('beta', 'RELEASES', response as never)).rejects.toThrow(NotFoundException)
    await expect(controller().artifact('stable', '../secret', response as never)).rejects.toThrow(NotFoundException)
    await expect(controller('').artifact('stable', 'RELEASES', response as never)).rejects.toThrow(NotFoundException)
  })
})
