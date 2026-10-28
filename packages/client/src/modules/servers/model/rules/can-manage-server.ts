import type { ServerRole } from '@gameplay/contracts'

/** Owner and admin open the server settings; plain members never do. */
function canManageServer(role: ServerRole): role is Exclude<ServerRole, 'member'> {
  return role === 'owner' || role === 'admin'
}

export { canManageServer }
