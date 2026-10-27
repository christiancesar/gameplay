import { describe, expect, it } from 'vitest'
import { hostnameInLogs, quickTunnelHostname } from './tunnel.ts'

describe('quickTunnelHostname', () => {
  it('reads the hostname of the metrics endpoint', () => {
    expect(quickTunnelHostname('{"hostname":"calm-river-1.trycloudflare.com"}')).toBe('calm-river-1.trycloudflare.com')
  })

  it('is null before the tunnel has one', () => {
    expect(quickTunnelHostname('{"hostname":""}')).toBeNull()
    expect(quickTunnelHostname('')).toBeNull()
    expect(quickTunnelHostname('not json')).toBeNull()
  })
})

describe('hostnameInLogs', () => {
  it('takes the last hostname printed', () => {
    const logs = 'INF https://old-one.trycloudflare.com\nINF restarted\nINF https://new-one.trycloudflare.com\n'

    expect(hostnameInLogs(logs)).toBe('new-one.trycloudflare.com')
  })

  it('is null without one', () => {
    expect(hostnameInLogs('INF starting tunnel')).toBeNull()
  })
})
