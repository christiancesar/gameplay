import {
  sfuCloseRequestSchema,
  sfuCloseResponseSchema,
  sfuLayerRequestSchema,
  sfuPublishRequestSchema,
  sfuRenegotiateRequestSchema,
  sfuSessionResponseSchema,
  sfuStatusResponseSchema,
  sfuTracksResponseSchema,
  sfuWatchRequestSchema,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'

export class SfuStatusResponseDto extends createZodDto(sfuStatusResponseSchema) {}
export class SfuSessionResponseDto extends createZodDto(sfuSessionResponseSchema) {}
export class SfuPublishRequestDto extends createZodDto(sfuPublishRequestSchema) {}
export class SfuWatchRequestDto extends createZodDto(sfuWatchRequestSchema) {}
export class SfuTracksResponseDto extends createZodDto(sfuTracksResponseSchema) {}
export class SfuRenegotiateRequestDto extends createZodDto(sfuRenegotiateRequestSchema) {}
export class SfuLayerRequestDto extends createZodDto(sfuLayerRequestSchema) {}
export class SfuCloseRequestDto extends createZodDto(sfuCloseRequestSchema) {}
export class SfuCloseResponseDto extends createZodDto(sfuCloseResponseSchema) {}
