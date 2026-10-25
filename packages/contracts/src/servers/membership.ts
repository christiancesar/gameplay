import { z } from 'zod'
import { REGISTRATION_KEY_ALPHABET } from '../account/registration-key.js'
import { serverRoleSchema } from './server.js'

export const SERVER_INVITE_CODE_LENGTH = 8
// Valid for 1 hour, fixed.
export const SERVER_INVITE_TTL_MINUTES = 60

// Same alphabet as the registration key (no 0/O, 1/I); case does not matter.
export const serverInviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(SERVER_INVITE_CODE_LENGTH)
  .regex(new RegExp(`^[${REGISTRATION_KEY_ALPHABET}]+$`))

const userRefSchema = z.object({ id: z.string(), username: z.string() })
export type UserRef = z.infer<typeof userRefSchema>

const memberUserSchema = userRefSchema.extend({
  displayUsername: z.string().nullable(),
  image: z.string().nullable(),
})

export const serverInviteStatusSchema = z.enum(['active', 'expired', 'used', 'revoked'])
export type ServerInviteStatus = z.infer<typeof serverInviteStatusSchema>

export const serverInviteSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: serverInviteStatusSchema,
  createdBy: userRefSchema,
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  usedBy: userRefSchema.nullable(),
  usedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
})
export type ServerInvite = z.infer<typeof serverInviteSchema>

export const listServerInvitesResponseSchema = z.object({
  invites: z.array(serverInviteSchema),
})
export type ListServerInvitesResponse = z.infer<typeof listServerInvitesResponseSchema>

// Public: read by the invite landing, with or without a session.
export const resolvedInviteSchema = z.object({
  // not-found also covers a deleted server.
  status: z.enum(['active', 'expired', 'used', 'revoked', 'not-found']),
  server: z
    .object({
      id: z.string(),
      name: z.string(),
      iconUrl: z.string().nullable(),
      memberCount: z.number().int(),
      // At the member limit the request would only wait.
      full: z.boolean(),
    })
    .nullable(),
  // false without a session.
  alreadyMember: z.boolean(),
})
export type ResolvedInvite = z.infer<typeof resolvedInviteSchema>

export const joinServerResponseSchema = z.object({
  serverId: z.string(),
  // joined: auto-approve with room; pending: waits for owner or admin;
  // already-member: nothing changed, the invite stays unused.
  result: z.enum(['joined', 'pending', 'already-member']),
})
export type JoinServerResponse = z.infer<typeof joinServerResponseSchema>

export const joinRequestSchema = z.object({
  id: z.string(),
  user: memberUserSchema,
  // Who created the invite used.
  invitedBy: userRefSchema,
  createdAt: z.iso.datetime(),
})
export type JoinRequest = z.infer<typeof joinRequestSchema>

export const listJoinRequestsResponseSchema = z.object({
  requests: z.array(joinRequestSchema),
})
export type ListJoinRequestsResponse = z.infer<typeof listJoinRequestsResponseSchema>

export const serverMemberSchema = z.object({
  user: memberUserSchema,
  role: serverRoleSchema,
  joinedAt: z.iso.datetime(),
  // How they joined; null for the owner, who created the server.
  invite: z.object({ id: z.string(), createdBy: userRefSchema }).nullable(),
})
export type ServerMember = z.infer<typeof serverMemberSchema>

export const listMembersResponseSchema = z.object({
  members: z.array(serverMemberSchema),
})
export type ListMembersResponse = z.infer<typeof listMembersResponseSchema>
