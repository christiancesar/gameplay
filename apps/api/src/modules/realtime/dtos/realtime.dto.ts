import {
  notificationNewSchema,
  presenceSnapshotSchema,
  presenceUpdateSchema,
  roomJoinResultSchema,
  roomJoinSchema,
  roomLeftSchema,
  roomParticipantsSchema,
  serverChangedSchema,
  serverRemovedSchema,
  serverSubscribeSchema,
  signalReceiveSchema,
  signalSendSchema,
  streamQualitySchema,
  streamStartSchema,
  streamTargetSchema,
  streamViewerQualitySchema,
  streamViewerSchema,
  voiceStateSchema,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Validation of what clients send, and payloads for the AsyncAPI document.
export class ServerSubscribeDto extends createZodDto(serverSubscribeSchema) {}
export class PresenceSnapshotDto extends createZodDto(presenceSnapshotSchema) {}
export class PresenceUpdateDto extends createZodDto(presenceUpdateSchema) {}
export class ServerChangedDto extends createZodDto(serverChangedSchema) {}
export class ServerRemovedDto extends createZodDto(serverRemovedSchema) {}
export class NoPayloadDto extends createZodDto(z.object({})) {}
export class RoomJoinDto extends createZodDto(roomJoinSchema) {}
export class RoomJoinResultDto extends createZodDto(roomJoinResultSchema) {}
export class RoomParticipantsDto extends createZodDto(roomParticipantsSchema) {}
export class RoomLeftDto extends createZodDto(roomLeftSchema) {}
export class VoiceStateDto extends createZodDto(voiceStateSchema) {}
export class StreamStartDto extends createZodDto(streamStartSchema) {}
export class StreamTargetDto extends createZodDto(streamTargetSchema) {}
export class StreamQualityDto extends createZodDto(streamQualitySchema) {}
export class StreamViewerDto extends createZodDto(streamViewerSchema) {}
export class StreamViewerQualityDto extends createZodDto(streamViewerQualitySchema) {}
export class SignalSendDto extends createZodDto(signalSendSchema) {}
export class SignalReceiveDto extends createZodDto(signalReceiveSchema) {}
export class NotificationNewDto extends createZodDto(notificationNewSchema) {}
