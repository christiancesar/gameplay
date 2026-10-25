import { z } from 'zod'

// How long a registration key stays valid.
export const REGISTRATION_INVITE_VALIDITIES = ['1d', '7d', '30d'] as const
export const registrationInviteValiditySchema = z.enum(REGISTRATION_INVITE_VALIDITIES)
export type RegistrationInviteValidity = z.infer<typeof registrationInviteValiditySchema>

export const REGISTRATION_INVITE_SUFFIX_LENGTH = 3

export const registrationInviteStatusSchema = z.enum(['active', 'used', 'revoked', 'expired'])
export type RegistrationInviteStatus = z.infer<typeof registrationInviteStatusSchema>

export const registrationInviteSchema = z.object({
  id: z.string(),
  // Last characters of the key; the key itself is shown only once.
  suffix: z.string(),
  status: registrationInviteStatusSchema,
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  usedAt: z.iso.datetime().nullable(),
  usedBy: z.object({ id: z.string(), username: z.string() }).nullable(),
})
export type RegistrationInvite = z.infer<typeof registrationInviteSchema>

export const generateRegistrationInviteRequestSchema = z.object({
  validity: registrationInviteValiditySchema,
})
export type GenerateRegistrationInviteRequest = z.infer<typeof generateRegistrationInviteRequestSchema>

export const generateRegistrationInviteResponseSchema = z.object({
  // The full key, returned only here.
  key: z.string(),
  invite: registrationInviteSchema,
})
export type GenerateRegistrationInviteResponse = z.infer<typeof generateRegistrationInviteResponseSchema>

export const listRegistrationInvitesResponseSchema = z.object({
  invites: z.array(registrationInviteSchema),
})
export type ListRegistrationInvitesResponse = z.infer<typeof listRegistrationInvitesResponseSchema>
