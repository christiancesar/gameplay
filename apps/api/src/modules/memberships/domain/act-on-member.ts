import type { ServerRole } from '@gameplay/contracts'
import { type MemberAction, ServerPermissions } from '../../servers/domain/server-permissions'
import { ServerPermissionDeniedError } from '../../servers/errors/servers.errors'
import { CannotTargetSelfError, MemberNotFoundError } from '../errors/memberships.errors'
import type { MembershipStore } from '../repositories/memberships.repository'

type Target = { serverId: string; actorRole: ServerRole; actorId: string; targetId: string }

// The target's current role, once the actor may do `action` to them. Reading
// it inside the lock keeps two moderators from acting on a stale role.
export async function targetRole(
  store: MembershipStore,
  { serverId, actorRole, actorId, targetId }: Target,
  action: MemberAction,
): Promise<ServerRole> {
  if (actorId === targetId) throw new CannotTargetSelfError()
  const role = await store.findRole(serverId, targetId)
  if (!role) throw new MemberNotFoundError()
  if (!ServerPermissions.canActOn(actorRole, role, action)) throw new ServerPermissionDeniedError()
  return role
}
