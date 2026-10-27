import { describe, expect, it } from 'vitest'

import { normalizeServerAddress } from './normalize-server-address'

describe('normalizeServerAddress', () => {
  it('takes a bare host as https', () => {
    expect(normalizeServerAddress('play.example.com')).toBe('https://play.example.com')
    expect(normalizeServerAddress('  play.example.com:8443  ')).toBe('https://play.example.com:8443')
  })

  it('keeps only the origin', () => {
    expect(normalizeServerAddress('https://play.example.com/servers/abc?x=1#y')).toBe('https://play.example.com')
  })

  it('takes this machine as http, with or without the scheme', () => {
    expect(normalizeServerAddress('localhost:8080')).toBe('http://localhost:8080')
    expect(normalizeServerAddress('127.0.0.1:3333')).toBe('http://127.0.0.1:3333')
    expect(normalizeServerAddress('http://localhost:8080/api')).toBe('http://localhost:8080')
  })

  it('refuses plain http to another machine, other schemes and nonsense', () => {
    expect(normalizeServerAddress('http://play.example.com')).toBeNull()
    expect(normalizeServerAddress('ftp://play.example.com')).toBeNull()
    expect(normalizeServerAddress('')).toBeNull()
    expect(normalizeServerAddress('not a host')).toBeNull()
  })
})
