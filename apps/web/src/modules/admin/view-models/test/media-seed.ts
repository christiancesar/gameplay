import type { AdminMediaResponse, MediaImpact, ServerMediaOverrides } from '@gameplay/contracts'

const adminMedia: AdminMediaResponse = {
  settings: { sfu: true, mesh: true, turn: true },
  providers: { sfu: { name: 'cloudflare', state: 'ready' }, turn: { name: 'cloudflare', state: 'ready' } },
  exceptions: [{ serverId: 'sv1', serverName: 'Turbex', overrides: { sfu: false, mesh: null, turn: null } }],
}

const mediaImpact: MediaImpact = { sfu: 2, mesh: 0, turn: 4 }

const serverMediaOverrides: ServerMediaOverrides = { sfu: null, mesh: null, turn: null }

export { adminMedia, mediaImpact, serverMediaOverrides }
