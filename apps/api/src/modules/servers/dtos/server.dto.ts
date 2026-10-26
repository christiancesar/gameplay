import {
  createServerRequestSchema,
  listMyServersResponseSchema,
  listRoomsResponseSchema,
  myLimitsSchema,
  reorderRoomsRequestSchema,
  roomNameRequestSchema,
  roomSchema,
  serverDetailSchema,
  serverImageResponseSchema,
  setAutoApproveRequestSchema,
  updateServerRequestSchema,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'

export class CreateServerRequestDto extends createZodDto(createServerRequestSchema) {}
export class UpdateServerRequestDto extends createZodDto(updateServerRequestSchema) {}
export class SetAutoApproveRequestDto extends createZodDto(setAutoApproveRequestSchema) {}
export class ServerDetailDto extends createZodDto(serverDetailSchema) {}
export class MyLimitsDto extends createZodDto(myLimitsSchema) {}
export class ListMyServersResponseDto extends createZodDto(listMyServersResponseSchema) {}
export class ServerImageResponseDto extends createZodDto(serverImageResponseSchema) {}
export class RoomNameRequestDto extends createZodDto(roomNameRequestSchema) {}
export class RoomDto extends createZodDto(roomSchema) {}
export class ReorderRoomsRequestDto extends createZodDto(reorderRoomsRequestSchema) {}
export class ListRoomsResponseDto extends createZodDto(listRoomsResponseSchema) {}
