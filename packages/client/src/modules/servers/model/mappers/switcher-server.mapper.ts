import type { ServerSummary } from '@gameplay/contracts'

type SwitcherServer = { id: string; name: string; iconUrl?: string }

function toSwitcherServers(servers: readonly ServerSummary[]): SwitcherServer[] {
  return servers.map((server) => ({ id: server.id, name: server.name, iconUrl: server.iconUrl ?? undefined }))
}

export { toSwitcherServers }
export type { SwitcherServer }
