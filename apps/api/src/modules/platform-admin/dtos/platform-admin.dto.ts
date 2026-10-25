import {
  type AdminServer,
  type AdminServerDetail,
  type AdminSession,
  type AdminUser,
  adminListQuerySchema,
  adminServerDetailSchema,
  hardwareSummarySchema,
  listAdminServersResponseSchema,
  listAdminSessionsResponseSchema,
  listAdminUsersResponseSchema,
  resetPasswordRequestSchema,
  resetPasswordResponseSchema,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'
import { toServerMemberDto } from '../../memberships/dtos/membership.dto'
import type { AccountSession } from '../providers/auth-accounts'
import type { AdminServerView } from '../services/admin-server-views.service'
import type { AdminServerDetailView } from '../use-cases/get-server-detail.use-case'
import type { AdminUserListItem } from '../use-cases/list-users.use-case'

export class AdminListQueryDto extends createZodDto(adminListQuerySchema) {}
export class ListAdminUsersResponseDto extends createZodDto(listAdminUsersResponseSchema) {}
export class ListAdminSessionsResponseDto extends createZodDto(listAdminSessionsResponseSchema) {}
export class ResetPasswordRequestDto extends createZodDto(resetPasswordRequestSchema) {}
export class ResetPasswordResponseDto extends createZodDto(resetPasswordResponseSchema) {}
export class ListAdminServersResponseDto extends createZodDto(listAdminServersResponseSchema) {}
export class AdminServerDetailDto extends createZodDto(adminServerDetailSchema) {}
export class HardwareSummaryDto extends createZodDto(hardwareSummarySchema) {}

export function toAdminUserDto(user: AdminUserListItem): AdminUser {
  return { ...user, createdAt: user.createdAt.toISOString() }
}

export function toAdminSessionDto(session: AccountSession): AdminSession {
  return { ...session, createdAt: session.createdAt.toISOString(), expiresAt: session.expiresAt.toISOString() }
}

export function toAdminServerDto(server: AdminServerView): AdminServer {
  return {
    id: server.id,
    name: server.name,
    iconUrl: server.iconUrl,
    owner: server.owner,
    memberCount: server.memberCount,
    roomCount: server.roomCount,
    createdAt: server.createdAt.toISOString(),
  }
}

export function toAdminServerDetailDto(server: AdminServerDetailView): AdminServerDetail {
  return {
    ...toAdminServerDto(server),
    rooms: server.rooms.map(({ id, name, position }) => ({ id, name, position })),
    members: server.members.map(toServerMemberDto),
  }
}
