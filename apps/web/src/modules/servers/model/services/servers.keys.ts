/** Query keys of the servers module. Socket handlers invalidate these without knowing the screens. */
const serversKeys = {
  all: ['servers'] as const,
  list: () => [...serversKeys.all, 'list'] as const,
  detail: (serverId: string) => [...serversKeys.all, 'detail', serverId] as const,
  members: (serverId: string) => [...serversKeys.detail(serverId), 'members'] as const,
  invites: (serverId: string) => [...serversKeys.detail(serverId), 'invites'] as const,
  joinRequests: (serverId: string) => [...serversKeys.detail(serverId), 'join-requests'] as const,
}

export { serversKeys }
