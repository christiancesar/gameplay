import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ shell: { openExternal: vi.fn() } }))

import { CONTENT_SECURITY_POLICY, isAppUrl, isWebUrl } from './security'

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

describe('CONTENT_SECURITY_POLICY', () => {
  it('keeps scripts, objects and frames to the app itself', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'")
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'")
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'")
    expect(CONTENT_SECURITY_POLICY).not.toContain("'unsafe-eval'")
  })
})
