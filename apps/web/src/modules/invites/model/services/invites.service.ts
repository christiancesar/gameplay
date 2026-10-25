import { joinServerResponseSchema, resolvedInviteSchema } from '@gameplay/contracts'
import type { JoinServerResponse, ResolvedInvite } from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

/** Public: works with and without a session. */
async function resolveInvite(code: string): Promise<ResolvedInvite> {
  const { data } = await http.get(`/invites/${encodeURIComponent(code)}`)
  return resolvedInviteSchema.parse(data)
}

async function joinByInvite(code: string): Promise<JoinServerResponse> {
  const { data } = await http.post(`/invites/${encodeURIComponent(code)}/join`)
  return joinServerResponseSchema.parse(data)
}

export { joinByInvite, resolveInvite }
