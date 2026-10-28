import { beforeEach, describe, expect, it } from 'vitest'

import { setCurrentPlatform } from '@/shared/platform/current-platform'
import { FakePlatform } from '@/shared/platform/test/fake-platform'

import { createSocket } from './socket'

/** The address the manager of the socket was built with; its type hides it. */
const addressOf = (socket: ReturnType<typeof createSocket>) => (socket.io as unknown as { uri: string }).uri

describe('createSocket', () => {
  beforeEach(() => {
    setCurrentPlatform(new FakePlatform())
  })

  it('stays off until asked', () => {
    const socket = createSocket()

    expect(socket.connected).toBe(false)
    expect(socket.active).toBe(false)
  })

  it('connects to the page origin on the web', () => {
    expect(addressOf(createSocket())).toBe(window.location.origin)
  })

  it('connects to the server the platform points to on the desktop', () => {
    setCurrentPlatform(new FakePlatform({ kind: 'desktop', serverChoice: { chosen: 'https://play.example.com' } }))

    expect(addressOf(createSocket())).toBe('https://play.example.com')
  })
})
