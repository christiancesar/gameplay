import type { JoinRequestRecord } from './membership'
import { JoinRequestDecidedError, JoinRequestNotFoundError } from '../errors/memberships.errors'
import type { MembershipStore } from '../repositories/memberships.repository'

// The pending request of this server, or the reason it can't be decided.
export async function pendingRequest(
  store: MembershipStore,
  serverId: string,
  requestId: string,
): Promise<JoinRequestRecord> {
  const request = await store.findRequest(requestId)
  if (!request || request.serverId !== serverId) throw new JoinRequestNotFoundError()
  if (request.status !== 'pending') throw new JoinRequestDecidedError()
  return request
}
