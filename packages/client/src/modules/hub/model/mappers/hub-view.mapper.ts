import type { ServerSummary } from '@gameplay/contracts'

import type { HubServer, HubUser } from '@/modules/hub/model/entities/hub-server'
import { displayNameOf, type NamedUser } from '@/shared/lib/display-name'

type SessionUser = NamedUser & { email: string; image?: string | null }

function toHubUser(user: SessionUser): HubUser {
  return { name: displayNameOf(user), email: user.email, avatarUrl: user.image ?? undefined }
}

function toHubServer(server: ServerSummary): HubServer {
  return { id: server.id, name: server.name, iconUrl: server.iconUrl ?? undefined }
}

export { toHubServer, toHubUser }
