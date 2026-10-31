import {
  adminFeatureRequestSchema,
  changelogEntrySchema,
  createChangelogEntrySchema,
  createFeatureRequestSchema,
  createRoadmapItemSchema,
  featureRequestSchema,
  listAdminFeatureRequestsResponseSchema,
  listChangelogResponseSchema,
  listFeatureRequestsResponseSchema,
  listRoadmapResponseSchema,
  moderateFeatureRequestSchema,
  roadmapItemSchema,
  updateChangelogEntrySchema,
  updateRoadmapItemSchema,
  voteResponseSchema,
} from '@gameplay/contracts'
import { createZodDto } from 'nestjs-zod'

export class RoadmapItemDto extends createZodDto(roadmapItemSchema) {}
export class ListRoadmapResponseDto extends createZodDto(listRoadmapResponseSchema) {}
export class CreateRoadmapItemDto extends createZodDto(createRoadmapItemSchema) {}
export class UpdateRoadmapItemDto extends createZodDto(updateRoadmapItemSchema) {}
export class ChangelogEntryDto extends createZodDto(changelogEntrySchema) {}
export class ListChangelogResponseDto extends createZodDto(listChangelogResponseSchema) {}
export class CreateChangelogEntryDto extends createZodDto(createChangelogEntrySchema) {}
export class UpdateChangelogEntryDto extends createZodDto(updateChangelogEntrySchema) {}
export class FeatureRequestDto extends createZodDto(featureRequestSchema) {}
export class AdminFeatureRequestDto extends createZodDto(adminFeatureRequestSchema) {}
export class ListFeatureRequestsResponseDto extends createZodDto(listFeatureRequestsResponseSchema) {}
export class ListAdminFeatureRequestsResponseDto extends createZodDto(listAdminFeatureRequestsResponseSchema) {}
export class CreateFeatureRequestDto extends createZodDto(createFeatureRequestSchema) {}
export class ModerateFeatureRequestDto extends createZodDto(moderateFeatureRequestSchema) {}
export class VoteResponseDto extends createZodDto(voteResponseSchema) {}
