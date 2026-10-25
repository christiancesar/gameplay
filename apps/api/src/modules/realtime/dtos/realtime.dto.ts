import {
  presenceSnapshotSchema,
  presenceUpdateSchema,
  serverChangedSchema,
  serverRemovedSchema,
  serverSubscribeSchema,
} from '@gameplay/shared'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Validation of what clients send, and payloads for the AsyncAPI document.
export class ServerSubscribeDto extends createZodDto(serverSubscribeSchema) {}
export class PresenceSnapshotDto extends createZodDto(presenceSnapshotSchema) {}
export class PresenceUpdateDto extends createZodDto(presenceUpdateSchema) {}
export class ServerChangedDto extends createZodDto(serverChangedSchema) {}
export class ServerRemovedDto extends createZodDto(serverRemovedSchema) {}
export class NoPayloadDto extends createZodDto(z.object({})) {}
