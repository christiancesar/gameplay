import { describe, expect, it } from 'vitest'

import { isVpnDetected } from './is-vpn-detected'

describe('isVpnDetected', () => {
  it('is false when STUN and the API saw the same address', () => {
    expect(isVpnDetected(['203.0.113.7'], '203.0.113.7')).toBe(false)
  })

  it('is true when the same family differs', () => {
    expect(isVpnDetected(['198.51.100.9'], '203.0.113.7')).toBe(true)
    expect(isVpnDetected(['2001:db8::1'], '2001:db8::2')).toBe(true)
  })

  it('is false when any address of the family matches', () => {
    expect(isVpnDetected(['198.51.100.9', '203.0.113.7'], '203.0.113.7')).toBe(false)
  })

  it('never compares IPv4 with IPv6', () => {
    expect(isVpnDetected(['2001:db8::7'], '203.0.113.7')).toBe(false)
    expect(isVpnDetected(['203.0.113.7'], '2001:db8::7')).toBe(false)
  })

  it('compares IPv6 ignoring case', () => {
    expect(isVpnDetected(['2001:DB8::7'], '2001:db8::7')).toBe(false)
  })

  it('is false without data', () => {
    expect(isVpnDetected([], '203.0.113.7')).toBe(false)
    expect(isVpnDetected(['203.0.113.7'], null)).toBe(false)
  })
})
