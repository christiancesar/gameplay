import type { ServerNotificationType } from '@gameplay/contracts'
import type { DomainEvents } from '../../../common/events/domain-events'

// Who gets which Hub notice for an event. serverName is missing when the
// event does not carry it (the server still exists and has it).
export type Notice = { userIds: string[]; type: ServerNotificationType; serverId: string; serverName?: string }

type NoticeEvents = Pick<
  DomainEvents,
  | 'membership.join-requested'
  | 'membership.approved'
  | 'membership.removed'
  | 'membership.role-changed'
  | 'server.deleted'
  | 'server-invite.expired-on-sign-up'
>

// Null when the event tells nobody anything they did not just do themselves.
export const noticesFor: { [K in keyof NoticeEvents]: (event: NoticeEvents[K]) => Notice | null } = {
  // The requester learns the request is waiting for approval.
  'membership.join-requested': ({ serverId, userId }) => ({ userIds: [userId], type: 'join-request-sent', serverId }),
  // Auto-approve (no approver) let the person straight in; nothing to tell.
  'membership.approved': ({ serverId, userId, approvedById }) =>
    approvedById ? { userIds: [userId], type: 'join-approved', serverId } : null,
  'membership.removed': ({ serverId, userId, reason }) =>
    reason === 'kick' ? { userIds: [userId], type: 'kicked', serverId } : null,
  'membership.role-changed': ({ serverId, userId, role }) => ({
    userIds: [userId],
    type: role === 'admin' ? 'promoted' : 'demoted',
    serverId,
  }),
  // Everyone but who deleted it; the owner too when the platform admin did.
  'server.deleted': ({ serverId, serverName, memberIds, deletedById }) => ({
    userIds: memberIds.filter((id) => id !== deletedById),
    type: 'server-deleted',
    serverId,
    serverName,
  }),
  'server-invite.expired-on-sign-up': ({ userId, serverId, serverName }) => ({
    userIds: [userId],
    type: 'invite-expired',
    serverId,
    serverName,
  }),
}
