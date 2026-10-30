import { BadGatewayException, NotFoundException } from '@nestjs/common'
import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EnvService } from '../../../env/env.service'
import { PublicDownloadsController } from './public-downloads.controller'

function controller(baseUrl = 'https://bucket.example.com/gameplay/downloads') {
  const env = { get: () => baseUrl } as unknown as EnvService
  return new PublicDownloadsController(env)
}

const manifest = {
  version: '0.0.7',
  publishedAt: '2026-10-30T04:06:29.000Z',
  downloads: {
    windows: {
      architecture: 'x64',
      format: 'squirrel-installer',
      url: 'https://gameplay.oikos.company/api/downloads/stable/Gameplay-Setup.exe',
      size: 10,
      sha256: 'a'.repeat(64),
    },
    linuxDeb: {
      architecture: 'x64',
      format: 'deb',
      url: 'https://gameplay.oikos.company/api/downloads/stable/gameplay.deb',
      size: 20,
      sha256: 'b'.repeat(64),
    },
    linuxAppImage: {
      architecture: 'x64',
      format: 'appimage',
      url: 'https://gameplay.oikos.company/api/downloads/stable/Gameplay.AppImage',
      size: 30,
      sha256: 'c'.repeat(64),
    },
  },
}

describe('PublicDownloadsController', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('validates and proxies the stable manifest', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(manifest))))
    const response = Object.assign(new PassThrough(), {
      setHeader: vi.fn(),
      status: vi.fn(() => response),
      send: vi.fn(),
    })

    await controller().latest(response as never)

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      new URL('https://bucket.example.com/gameplay/downloads/stable/latest.json'),
    )
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store, max-age=0')
    expect(response.send).toHaveBeenCalledWith(JSON.stringify(manifest))
  })

  it('rejects an invalid manifest from storage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    await expect(controller().latest({} as never)).rejects.toThrow(BadGatewayException)
  })

  it('allows only the three public artifact names', async () => {
    await expect(controller().artifact('../secret', {} as never)).rejects.toThrow(NotFoundException)
  })
})
