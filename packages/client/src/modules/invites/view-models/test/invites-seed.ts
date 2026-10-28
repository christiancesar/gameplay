import type { JoinServerResponse, ResolvedInvite } from '@gameplay/contracts'

const code = 'JH34SD32'

const resolvedServer = { id: 'srv1', name: 'Turbex', iconUrl: null, memberCount: 6, full: false }

const activeInvite: ResolvedInvite = { status: 'active', server: resolvedServer, alreadyMember: false }
const fullServerInvite: ResolvedInvite = {
  status: 'active',
  server: { ...resolvedServer, full: true },
  alreadyMember: false,
}
const memberInvite: ResolvedInvite = { status: 'active', server: resolvedServer, alreadyMember: true }
const expiredMemberInvite: ResolvedInvite = { status: 'expired', server: resolvedServer, alreadyMember: true }
const expiredInvite: ResolvedInvite = { status: 'expired', server: resolvedServer, alreadyMember: false }
const usedInvite: ResolvedInvite = { status: 'used', server: resolvedServer, alreadyMember: false }
const revokedInvite: ResolvedInvite = { status: 'revoked', server: resolvedServer, alreadyMember: false }
const unknownInvite: ResolvedInvite = { status: 'not-found', server: null, alreadyMember: false }

const joined: JoinServerResponse = { serverId: 'srv1', result: 'joined' }
const pending: JoinServerResponse = { serverId: 'srv1', result: 'pending' }
const alreadyMember: JoinServerResponse = { serverId: 'srv1', result: 'already-member' }

const session = { user: { id: 'u2' } }

export {
  activeInvite,
  alreadyMember,
  code,
  expiredInvite,
  expiredMemberInvite,
  fullServerInvite,
  joined,
  memberInvite,
  pending,
  revokedInvite,
  session,
  unknownInvite,
  usedInvite,
}
