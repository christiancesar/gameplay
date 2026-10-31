import { z } from 'zod'

export const PUBLIC_ROADMAP_STATUSES = ['now', 'next', 'exploring', 'done'] as const
export const PUBLIC_CONTENT_VISIBILITIES = ['draft', 'published', 'archived'] as const
export const FEATURE_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'archived'] as const

export const publicRoadmapStatusSchema = z.enum(PUBLIC_ROADMAP_STATUSES)
export const publicContentVisibilitySchema = z.enum(PUBLIC_CONTENT_VISIBILITIES)
export const featureRequestStatusSchema = z.enum(FEATURE_REQUEST_STATUSES)
export type PublicContentVisibility = z.infer<typeof publicContentVisibilitySchema>

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const titleSchema = z.string().trim().min(1).max(160)
const descriptionSchema = z.string().trim().min(1).max(4000)
const contentSchema = z.string().trim().min(1).max(30000)

export const roadmapItemSchema = z.object({
  id: z.string(),
  slug: slugSchema,
  title: titleSchema,
  description: descriptionSchema,
  status: publicRoadmapStatusSchema,
  position: z.number().int().min(0),
  visibility: publicContentVisibilitySchema,
  voteCount: z.number().int().min(0),
  votedByMe: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type RoadmapItem = z.infer<typeof roadmapItemSchema>

export const changelogEntrySchema = z.object({
  id: z.string(),
  slug: slugSchema,
  version: z.string().trim().min(1).max(40),
  title: titleSchema,
  summary: descriptionSchema,
  body: contentSchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  visibility: publicContentVisibilitySchema,
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type ChangelogEntry = z.infer<typeof changelogEntrySchema>

export const featureRequestSchema = z.object({
  id: z.string(),
  title: titleSchema,
  description: descriptionSchema,
  status: featureRequestStatusSchema,
  roadmapItemId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type FeatureRequest = z.infer<typeof featureRequestSchema>

export const adminFeatureRequestSchema = featureRequestSchema.extend({
  author: z.object({ id: z.string(), username: z.string() }),
})
export type AdminFeatureRequest = z.infer<typeof adminFeatureRequestSchema>

export const createRoadmapItemSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  description: descriptionSchema,
  status: publicRoadmapStatusSchema,
  position: z.number().int().min(0),
  visibility: publicContentVisibilitySchema,
})
export type CreateRoadmapItem = z.infer<typeof createRoadmapItemSchema>
export const updateRoadmapItemSchema = createRoadmapItemSchema.partial()
export type UpdateRoadmapItem = z.infer<typeof updateRoadmapItemSchema>

export const createChangelogEntrySchema = z.object({
  slug: slugSchema,
  version: z.string().trim().min(1).max(40),
  title: titleSchema,
  summary: descriptionSchema,
  body: contentSchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  visibility: publicContentVisibilitySchema,
  publishedAt: z.iso.datetime().nullable().optional(),
})
export type CreateChangelogEntry = z.infer<typeof createChangelogEntrySchema>
export const updateChangelogEntrySchema = createChangelogEntrySchema.partial()
export type UpdateChangelogEntry = z.infer<typeof updateChangelogEntrySchema>

export const createFeatureRequestSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
})
export type CreateFeatureRequest = z.infer<typeof createFeatureRequestSchema>

export const moderateFeatureRequestSchema = z.object({
  status: featureRequestStatusSchema,
  roadmapItemId: z.string().nullable().optional(),
})
export type ModerateFeatureRequest = z.infer<typeof moderateFeatureRequestSchema>

export const listRoadmapResponseSchema = z.object({ items: z.array(roadmapItemSchema) })
export type ListRoadmapResponse = z.infer<typeof listRoadmapResponseSchema>
export const listChangelogResponseSchema = z.object({ entries: z.array(changelogEntrySchema) })
export type ListChangelogResponse = z.infer<typeof listChangelogResponseSchema>
export const listFeatureRequestsResponseSchema = z.object({ requests: z.array(featureRequestSchema) })
export type ListFeatureRequestsResponse = z.infer<typeof listFeatureRequestsResponseSchema>
export const listAdminFeatureRequestsResponseSchema = z.object({ requests: z.array(adminFeatureRequestSchema) })
export type ListAdminFeatureRequestsResponse = z.infer<typeof listAdminFeatureRequestsResponseSchema>
export const voteResponseSchema = z.object({
  itemId: z.string(),
  voted: z.boolean(),
  voteCount: z.number().int().min(0),
})
export type VoteResponse = z.infer<typeof voteResponseSchema>
