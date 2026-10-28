import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { authClient, placeholderBaseUrl } from './auth-client'

const SIGN_IN_ANSWER = { redirect: false, token: 't', user: { id: 'u1', email: 'a@b.c', name: 'a' } }

const answer = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })

describe('authClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the page origin on the web', async () => {
    setCurrentPlatform(new FakePlatform())
    fetchMock.mockImplementation(async () => answer(SIGN_IN_ANSWER))

    await authClient.signIn.email({ email: 'a@b.c', password: 'correct-horse-battery' })

    expect(String(fetchMock.mock.calls[0][0])).toBe('http://localhost:3000/api/auth/sign-in/email')
  })

  it('calls the server of the platform on the desktop, whatever the page origin', async () => {
    const platform = new FakePlatform({ kind: 'desktop', serverChoice: { chosen: 'https://play.example.com' } })
    setCurrentPlatform(platform)
    fetchMock.mockImplementation(async () => answer(SIGN_IN_ANSWER))

    await authClient.signIn.email({ email: 'a@b.c', password: 'correct-horse-battery' })
    await authClient.getSession()

    expect(String(fetchMock.mock.calls[0][0])).toBe('https://play.example.com/api/auth/sign-in/email')
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://play.example.com/api/auth/get-session')
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
