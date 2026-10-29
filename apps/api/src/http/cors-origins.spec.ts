import { DESKTOP_APP_ORIGIN } from '@gameplay/contracts'
import { afterEach, describe, expect, it } from 'vitest'
import { corsOrigins, socketCorsOrigin } from './cors-origins'

describe('cors origins', () => {
  afterEach(() => {
    delete process.env.WEB_ORIGIN
    delete process.env.DESKTOP_DEV_ORIGIN
  })

  it('keeps the web, desktop dev and packaged desktop origins', () => {
    expect(corsOrigins('https://play.example.com', 'http://localhost:5173')).toEqual([
      'https://play.example.com',
      'http://localhost:5173',
      DESKTOP_APP_ORIGIN,
    ])
  })

  it('does not duplicate an origin used by web and desktop dev', () => {
    expect(corsOrigins('http://localhost:5173', 'http://localhost:5173')).toEqual([
      'http://localhost:5173',
      DESKTOP_APP_ORIGIN,
    ])
  })

  it('answers Socket.IO origins from the loaded environment', () => {
    process.env.WEB_ORIGIN = 'https://play.example.com'
    process.env.DESKTOP_DEV_ORIGIN = 'http://localhost:5173'
    const answer = (origin: string | undefined) => {
      let allowed = false
      socketCorsOrigin(origin, (_error, result) => {
        allowed = result
      })
      return allowed
    }

    expect(answer('http://localhost:5173')).toBe(true)
    expect(answer('app://gameplay')).toBe(true)
    expect(answer('https://evil.example')).toBe(false)
  })
})
