import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { authClient, placeholderBaseUrl } from './auth-client'

const SIGN_IN_ANSWER = { redirect: false, token: 't', user: { id: 'u1', email: 'a@b.c', name: 'a' } }

/** A server answer; `url` is what the real fetch fills in and `new Response` leaves empty. */
function answer(body: unknown, { url, token }: { url: string; token?: string }) {
  const response = new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...(token ? { 'set-auth-token': token } : {}) },
  })
  Object.defineProperty(response, 'url', { value: url })
  return response
}

describe('authClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the page origin and sends no token on the web', async () => {
    setCurrentPlatform(new FakePlatform())
    fetchMock.mockResolvedValue(answer(SIGN_IN_ANSWER, { url: 'http://localhost:3000/api/auth/sign-in/email' }))

    await authClient.signIn.email({ email: 'a@b.c', password: 'correct-horse-battery' })

    const [input, init] = fetchMock.mock.calls[0]
    expect(String(input)).toBe('http://localhost:3000/api/auth/sign-in/email')
    expect(new Headers(init.headers).get('authorization')).toBeNull()
  })

  it('signs in on the server of the platform, stores the token it answers and sends it from then on', async () => {
    const platform = new FakePlatform({ kind: 'desktop', baseUrl: 'https://play.example.com' })
    setCurrentPlatform(platform)
    fetchMock.mockResolvedValueOnce(
      answer(SIGN_IN_ANSWER, { url: 'https://play.example.com/api/auth/sign-in/email', token: 'token-1' }),
    )

    await authClient.signIn.email({ email: 'a@b.c', password: 'correct-horse-battery' })

    expect(String(fetchMock.mock.calls[0][0])).toBe('https://play.example.com/api/auth/sign-in/email')
    expect(platform.token).toBe('token-1')

    fetchMock.mockResolvedValueOnce(
      answer({ session: null, user: null }, { url: 'https://play.example.com/api/auth/get-session' }),
    )
    await authClient.getSession()

    expect(String(fetchMock.mock.calls[1][0])).toBe('https://play.example.com/api/auth/get-session')
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('authorization')).toBe('Bearer token-1')
  })

  it('forgets the token on sign-out', async () => {
    const platform = new FakePlatform({ kind: 'desktop', baseUrl: 'https://play.example.com', token: 'token-1' })
    setCurrentPlatform(platform)
    fetchMock.mockResolvedValue(answer({ success: true }, { url: 'https://play.example.com/api/auth/sign-out' }))

    await authClient.signOut()

    expect(platform.token).toBeNull()
  })
})

describe('placeholderBaseUrl', () => {
  it('leaves an http(s) page to the client, and stands in for any other origin', () => {
    expect(placeholderBaseUrl('https://play.example.com')).toBeUndefined()
    expect(placeholderBaseUrl('http://localhost:5173')).toBeUndefined()
    expect(placeholderBaseUrl('app://gameplay')).toBe('https://server.invalid')
    expect(placeholderBaseUrl('')).toBe('https://server.invalid')
  })
})
