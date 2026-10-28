import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy } from './content-security-policy'
import { isAppUrl, isWebUrl } from './app-url'

describe('isAppUrl', () => {
  it('takes only the pages the app serves', () => {
    expect(isAppUrl('app://gameplay/')).toBe(true)
    expect(isAppUrl('app://gameplay/servers/abc?x=1')).toBe(true)
    expect(isAppUrl('app://other/')).toBe(false)
    expect(isAppUrl('https://gameplay.example.com/')).toBe(false)
    expect(isAppUrl('file:///etc/passwd')).toBe(false)
    expect(isAppUrl('nonsense')).toBe(false)
  })

  it('takes the Vite server of the dev run, and only that one', () => {
    expect(isAppUrl('http://localhost:5173/', 'http://localhost:5173')).toBe(true)
    expect(isAppUrl('http://localhost:5173/', undefined)).toBe(false)
    expect(isAppUrl('http://localhost:9999/', 'http://localhost:5173')).toBe(false)
  })
})

describe('isWebUrl', () => {
  it('lets only http and https out of the app', () => {
    expect(isWebUrl('https://example.com/a')).toBe(true)
    expect(isWebUrl('http://example.com')).toBe(true)
    expect(isWebUrl('file:///etc/passwd')).toBe(false)
    expect(isWebUrl('javascript:alert(1)')).toBe(false)
    expect(isWebUrl('app://gameplay/')).toBe(false)
  })
})

describe('contentSecurityPolicy', () => {
  it('keeps scripts, objects and frames to the app itself', () => {
    for (const policy of [contentSecurityPolicy(null), contentSecurityPolicy('https://play.example.com')]) {
      expect(policy).toContain("script-src 'self'")
      expect(policy).toContain("object-src 'none'")
      expect(policy).toContain("frame-ancestors 'none'")
      expect(policy).not.toContain("'unsafe-eval'")
    }
  })

  it('stays open to https and to this machine while the user picks the server', () => {
    const policy = contentSecurityPolicy(null)
    expect(policy).toContain("connect-src 'self' https: wss:")
    expect(policy).toContain("img-src 'self' data: blob: https:")
  })

  it('closes the connections and images on the server the build is tied to', () => {
    const policy = contentSecurityPolicy('https://play.example.com')
    expect(policy).toContain("connect-src 'self' https://play.example.com wss://play.example.com")
    expect(policy).toContain("img-src 'self' data: blob: https://play.example.com;")
    expect(policy).not.toContain(' https: ')
  })

  it('uses the plain socket scheme for a server on this machine', () => {
    expect(contentSecurityPolicy('http://localhost:3333')).toContain('http://localhost:3333 ws://localhost:3333')
  })
})
