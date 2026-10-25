import type { ServerSummary } from '@gameplay/contracts'

import type { HubServer, HubUser } from '@/modules/hub/views/hub.view'

type SessionUser = { name: string; email: string; image?: string | null }

function toHubUser(user: SessionUser): HubUser {
  return { name: user.name, email: user.email, avatarUrl: user.image ?? undefined }
}

function toHubServer(server: ServerSummary): HubServer {
  return { id: server.id, name: server.name, iconUrl: server.iconUrl ?? undefined }
}

export { toHubServer, toHubUser }
