import type { SocketAuth } from '@gameplay/contracts'
import { beforeEach, describe, expect, it } from 'vitest'

import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { createSocket } from './socket'

/** What the socket would put in the handshake `auth` right now. */
function handshakeAuth(socket: ReturnType<typeof createSocket>): Promise<SocketAuth> {
  const auth = socket.auth as (send: (data: SocketAuth) => void) => void
  return new Promise((resolve) => auth(resolve))
}

describe('createSocket', () => {
  beforeEach(() => {
    setCurrentPlatform(new FakePlatform())
  })

  it('stays off until asked, and sends no token on the web', async () => {
    const socket = createSocket()

    expect(socket.connected).toBe(false)
    expect(socket.active).toBe(false)
    expect(await handshakeAuth(socket)).toEqual({})
  })

  it('connects to the server of the platform with its session token, read at each attempt', async () => {
    const platform = new FakePlatform({ kind: 'desktop', baseUrl: 'https://play.example.com', token: 'token-1' })
    setCurrentPlatform(platform)

    const socket = createSocket()

    // The manager keeps the address it was built with; the type hides it.
    expect((socket.io as unknown as { uri: string }).uri).toBe('https://play.example.com')
    expect(await handshakeAuth(socket)).toEqual({ token: 'token-1' })
    platform.token = 'token-2'
    expect(await handshakeAuth(socket)).toEqual({ token: 'token-2' })
    platform.server.session.clearToken()
    expect(await handshakeAuth(socket)).toEqual({})
  })
})
