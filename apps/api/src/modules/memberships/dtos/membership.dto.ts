import {
  joinServerResponseSchema,
  listJoinRequestsResponseSchema,
  listMembersResponseSchema,
  listServerInvitesResponseSchema,
  resolvedInviteSchema,
  serverInviteSchema,
  type JoinRequest,
  type ServerInvite,
  type ServerMember,
} from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'
import {
  type InviteListItem,
  type JoinRequestListItem,
  type MemberListItem,
  serverInviteStatus,
} from '../domain/membership'

export class ServerInviteDto extends createZodDto(serverInviteSchema) {}
export class ListServerInvitesResponseDto extends createZodDto(listServerInvitesResponseSchema) {}
export class ResolvedInviteDto extends createZodDto(resolvedInviteSchema) {}
export class JoinServerResponseDto extends createZodDto(joinServerResponseSchema) {}
export class ListJoinRequestsResponseDto extends createZodDto(listJoinRequestsResponseSchema) {}
export class ListMembersResponseDto extends createZodDto(listMembersResponseSchema) {}

export function toServerInviteDto(invite: InviteListItem, now = new Date()): ServerInvite {
  return {
    id: invite.id,
    code: invite.code,
    status: serverInviteStatus(invite, now),
    createdBy: invite.createdBy,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    usedBy: invite.usedBy,
    usedAt: invite.usedAt?.toISOString() ?? null,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
  }
}

export function toJoinRequestDto(request: JoinRequestListItem): JoinRequest {
  return {
    id: request.id,
    user: request.user,
    invitedBy: request.invitedBy,
    createdAt: request.createdAt.toISOString(),
  }
}

export function toServerMemberDto(member: MemberListItem): ServerMember {
  return { ...member, joinedAt: member.joinedAt.toISOString() }
}
