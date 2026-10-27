import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { http } from './http'

const originalAdapter = http.defaults.adapter

/** The adapter answers instead of the network and keeps the config each request had when it left. */
function captureRequests() {
  const sent: InternalAxiosRequestConfig[] = []
  http.defaults.adapter = async (config) => {
    sent.push(config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
  return sent
}

describe('http', () => {
  beforeEach(() => {
    setCurrentPlatform(new FakePlatform())
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('calls /api on the page origin, with no token, on the web', async () => {
    const sent = captureRequests()

    await http.get('/servers')

    expect(sent[0].baseURL).toBe('/api')
    expect(sent[0].headers.get('Authorization')).toBeFalsy()
  })

  it('calls the server the platform points to, with the session token, on the desktop', async () => {
    const platform = new FakePlatform({ kind: 'desktop', baseUrl: 'https://play.example.com', token: 'token-1' })
    setCurrentPlatform(platform)
    const sent = captureRequests()

    await http.get('/servers')
    platform.token = 'token-2'
    await http.get('/servers')

    expect(sent[0].baseURL).toBe('https://play.example.com/api')
    expect(sent[0].headers.get('Authorization')).toBe('Bearer token-1')
    expect(sent[1].headers.get('Authorization')).toBe('Bearer token-2')
  })
})
