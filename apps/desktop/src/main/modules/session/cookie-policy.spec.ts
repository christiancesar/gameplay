import { describe, expect, it } from 'vitest'

import { toCrossSiteCookie, withCrossSiteCookies } from './cookie-policy'

describe('toCrossSiteCookie', () => {
  it('replaces SameSite=Lax and keeps the other attributes', () => {
    expect(toCrossSiteCookie('gameplay.session_token=abc; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax')).toBe(
      'gameplay.session_token=abc; Max-Age=604800; Path=/; HttpOnly; SameSite=None; Secure',
    )
  })

  it('adds both when the cookie had neither, and does not repeat Secure', () => {
    expect(toCrossSiteCookie('a=b; Path=/')).toBe('a=b; Path=/; SameSite=None; Secure')
    expect(toCrossSiteCookie('a=b; secure; samesite=strict')).toBe('a=b; SameSite=None; Secure')
  })
})

describe('withCrossSiteCookies', () => {
  it('rewrites every Set-Cookie, whatever the case of the header name, and leaves the others', () => {
    const headers = { 'set-cookie': ['a=1; SameSite=Lax', 'b=2'], 'content-type': ['application/json'] }

    expect(withCrossSiteCookies(headers)).toEqual({
      'set-cookie': ['a=1; SameSite=None; Secure', 'b=2; SameSite=None; Secure'],
      'content-type': ['application/json'],
    })
  })

  it('hands back the headers when there is no cookie', () => {
    const headers = { 'content-type': ['text/html'] }
    expect(withCrossSiteCookies(headers)).toBe(headers)
  })
})
