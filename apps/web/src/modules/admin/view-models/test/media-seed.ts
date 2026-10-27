import type { AdminMediaResponse, MediaImpact, RealtimeUsagePeriod, ServerMediaOverrides } from '@gameplay/contracts'

const adminMedia: AdminMediaResponse = {
  settings: { sfu: true, mesh: true, turn: true },
  usage: {
    month: '2026-10',
    budgetGb: 800,
    freeTierGb: 1000,
    sfu: { reportedBytes: 240_000_000_000, cloudflareBytes: 250_000_000_000 },
    turn: { cloudflareBytes: 12_000_000_000 },
    cloudflare: { state: 'ready', checkedAt: '2026-10-27T10:00:00.000Z' },
  },
  providers: { sfu: { name: 'cloudflare', state: 'ready' }, turn: { name: 'cloudflare', state: 'ready' } },
  exceptions: [{ serverId: 'sv1', serverName: 'Turbex', overrides: { sfu: false, mesh: null, turn: null } }],
}

const mediaUsage: RealtimeUsagePeriod = {
  from: '2026-10-26T10:00:00.000Z',
  to: '2026-10-27T10:00:00.000Z',
  bucket: 'fifteen-minutes',
  sfu: { cloudflareBytes: 500 },
  turn: { cloudflareBytes: null },
  points: [{ at: '2026-10-26T10:00:00.000Z', sfuBytes: 500, turnBytes: null }],
  cloudflare: { state: 'ready', checkedAt: '2026-10-27T10:00:00.000Z' },
}

const mediaImpact: MediaImpact = { sfu: 2, mesh: 0, turn: 4 }

const serverMediaOverrides: ServerMediaOverrides = { sfu: null, mesh: null, turn: null }

export { adminMedia, mediaImpact, mediaUsage, serverMediaOverrides }
