import { z } from 'zod'

export const SERVER_NAME_MAX = 40
export const SERVER_DESCRIPTION_MAX = 280
export const ROOM_NAME_MAX = 40

export const SERVER_ROLES = ['owner', 'admin', 'member'] as const
export const serverRoleSchema = z.enum(SERVER_ROLES)
export type ServerRole = z.infer<typeof serverRoleSchema>

export const serverNameSchema = z.string().trim().min(1).max(SERVER_NAME_MAX)
export const roomNameSchema = z.string().trim().min(1).max(ROOM_NAME_MAX)
// An empty description is stored as none.
const descriptionSchema = z
  .string()
  .trim()
  .max(SERVER_DESCRIPTION_MAX)
  .transform((value) => value || null)
  .nullable()

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int(),
})
export type Room = z.infer<typeof roomSchema>

// Hub list: the servers the user belongs to.
export const serverSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  role: serverRoleSchema,
})
export type ServerSummary = z.infer<typeof serverSummarySchema>

export const listMyServersResponseSchema = z.object({
  servers: z.array(serverSummarySchema),
})
export type ListMyServersResponse = z.infer<typeof listMyServersResponseSchema>

export const serverDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  autoApprove: z.boolean(),
  ownerId: z.string(),
  // Role of the user asking.
  role: serverRoleSchema,
  memberCount: z.number().int(),
  // Effective limits (override or global default).
  limits: z.object({ maxMembers: z.number().int(), maxRooms: z.number().int() }),
  rooms: z.array(roomSchema),
})
export type ServerDetail = z.infer<typeof serverDetailSchema>

export const createServerRequestSchema = z.object({
  name: serverNameSchema,
  description: descriptionSchema.optional(),
  // Name of the room every new server starts with, in the creator's language.
  defaultRoomName: roomNameSchema.optional(),
})
export type CreateServerRequest = z.input<typeof createServerRequestSchema>

// Only the fields sent are changed.
export const updateServerRequestSchema = z
  .object({
    name: serverNameSchema,
    description: descriptionSchema,
  })
  .partial()
export type UpdateServerRequest = z.input<typeof updateServerRequestSchema>

export const setAutoApproveRequestSchema = z.object({
  autoApprove: z.boolean(),
})
export type SetAutoApproveRequest = z.infer<typeof setAutoApproveRequestSchema>

export const serverImageResponseSchema = z.object({
  url: z.string(),
})
export type ServerImageResponse = z.infer<typeof serverImageResponseSchema>

export const roomNameRequestSchema = z.object({
  name: roomNameSchema,
})
export type RoomNameRequest = z.input<typeof roomNameRequestSchema>

// Every room of the server, in the new order.
export const reorderRoomsRequestSchema = z.object({
  roomIds: z.array(z.string()).min(1).max(100),
})
export type ReorderRoomsRequest = z.infer<typeof reorderRoomsRequestSchema>

export const listRoomsResponseSchema = z.object({
  rooms: z.array(roomSchema),
})
export type ListRoomsResponse = z.infer<typeof listRoomsResponseSchema>
