import {
  generateRegistrationInviteRequestSchema,
  generateRegistrationInviteResponseSchema,
  listRegistrationInvitesResponseSchema,
  type RegistrationInvite,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'
import { type RegistrationInviteRecord, registrationInviteStatus } from '../domain/registration-invite'

export class GenerateRegistrationInviteRequestDto extends createZodDto(generateRegistrationInviteRequestSchema) {}
export class GenerateRegistrationInviteResponseDto extends createZodDto(generateRegistrationInviteResponseSchema) {}
export class ListRegistrationInvitesResponseDto extends createZodDto(listRegistrationInvitesResponseSchema) {}

export function toRegistrationInviteDto(invite: RegistrationInviteRecord, now = new Date()): RegistrationInvite {
  return {
    id: invite.id,
    suffix: invite.keySuffix,
    status: registrationInviteStatus(invite, now),
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    usedAt: invite.usedAt?.toISOString() ?? null,
    usedBy: invite.usedBy,
  }
}
