import {
  adminMediaResponseSchema,
  mediaChangeResponseSchema,
  mediaImpactSchema,
  realtimeUsagePeriodSchema,
  realtimeUsageQuerySchema,
  serverMediaOverridesSchema,
  serverMediaSchema,
  updateMediaSettingsRequestSchema,
  updateServerMediaRequestSchema,
  updateSfuBudgetRequestSchema,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export class AdminMediaResponseDto extends createZodDto(adminMediaResponseSchema) {}
export class UpdateMediaSettingsRequestDto extends createZodDto(updateMediaSettingsRequestSchema) {}
export class UpdateServerMediaRequestDto extends createZodDto(updateServerMediaRequestSchema) {}
export class MediaChangeResponseDto extends createZodDto(mediaChangeResponseSchema) {}
export class MediaImpactDto extends createZodDto(mediaImpactSchema) {}
export class MediaImpactQueryDto extends createZodDto(z.object({ serverId: z.string().min(1).optional() })) {}
export class ServerMediaOverridesDto extends createZodDto(serverMediaOverridesSchema) {}
export class ServerMediaDto extends createZodDto(serverMediaSchema) {}
export class UpdateSfuBudgetRequestDto extends createZodDto(updateSfuBudgetRequestSchema) {}
export class RealtimeUsageQueryDto extends createZodDto(realtimeUsageQuerySchema) {}
export class RealtimeUsagePeriodDto extends createZodDto(realtimeUsagePeriodSchema) {}
