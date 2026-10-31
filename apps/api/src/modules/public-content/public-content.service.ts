import { Injectable } from '@nestjs/common'
import type {
  AdminFeatureRequest,
  ChangelogEntry,
  CreateChangelogEntry,
  CreateFeatureRequest,
  CreateRoadmapItem,
  FeatureRequest,
  ListAdminFeatureRequestsResponse,
  ListChangelogResponse,
  ListFeatureRequestsResponse,
  ListRoadmapResponse,
  ModerateFeatureRequest,
  RoadmapItem,
  UpdateChangelogEntry,
  UpdateRoadmapItem,
  VoteResponse,
} from '@gameplay/contracts'
import type {
  ChangelogEntry as DbChangelogEntry,
  FeatureRequest as DbFeatureRequest,
  RoadmapItem as DbRoadmapItem,
} from '../../generated/prisma/client'
import { PrismaService } from '../../lib/prisma'
import {
  FeatureVoteAlreadyExistsError,
  PublicContentConflictError,
  PublicContentNotFoundError,
} from './errors/public-content.errors'
import { publishedAtFor } from './domain/public-content.rules'

const ROADMAP_STATUS_TO_DB = { now: 'NOW', next: 'NEXT', exploring: 'EXPLORING', done: 'DONE' } as const
const ROADMAP_STATUS_FROM_DB = { NOW: 'now', NEXT: 'next', EXPLORING: 'exploring', DONE: 'done' } as const
const VISIBILITY_TO_DB = { draft: 'DRAFT', published: 'PUBLISHED', archived: 'ARCHIVED' } as const
const VISIBILITY_FROM_DB = { DRAFT: 'draft', PUBLISHED: 'published', ARCHIVED: 'archived' } as const
const REQUEST_STATUS_TO_DB = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  archived: 'ARCHIVED',
} as const
const REQUEST_STATUS_FROM_DB = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const

type RoadmapRow = DbRoadmapItem & { _count: { votes: number }; votes?: { userId: string }[] }
type ChangelogRow = DbChangelogEntry
type FeatureRequestRow = DbFeatureRequest & {
  author: { id: string; username: string | null }
}

function iso(date: Date | null): string | null {
  return date?.toISOString() ?? null
}

function username(value: string | null, fallback: string): string {
  return value ?? fallback
}

function toRoadmapItem(row: RoadmapRow, userId?: string): RoadmapItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    status: ROADMAP_STATUS_FROM_DB[row.status],
    position: row.position,
    visibility: VISIBILITY_FROM_DB[row.visibility],
    voteCount: row._count.votes,
    votedByMe: userId ? (row.votes?.some((vote) => vote.userId === userId) ?? false) : false,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toChangelogEntry(row: ChangelogRow): ChangelogEntry {
  return {
    id: row.id,
    slug: row.slug,
    version: row.version,
    title: row.title,
    summary: row.summary,
    body: row.body,
    tags: row.tags,
    visibility: VISIBILITY_FROM_DB[row.visibility],
    publishedAt: iso(row.publishedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toFeatureRequest(row: DbFeatureRequest): FeatureRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: REQUEST_STATUS_FROM_DB[row.status],
    roadmapItemId: row.roadmapItemId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toAdminFeatureRequest(row: FeatureRequestRow): AdminFeatureRequest {
  return {
    ...toFeatureRequest(row),
    author: { id: row.author.id, username: username(row.author.username, row.author.id) },
  }
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedRoadmap(userId?: string): Promise<ListRoadmapResponse> {
    const rows = await this.prisma.roadmapItem.findMany({
      where: { visibility: 'PUBLISHED' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { votes: true } },
        ...(userId ? { votes: { where: { userId }, select: { userId: true } } } : {}),
      },
    })
    return { items: rows.map((row) => toRoadmapItem(row as RoadmapRow, userId)) }
  }

  async listRoadmap(): Promise<ListRoadmapResponse> {
    const rows = await this.prisma.roadmapItem.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { votes: true } } },
    })
    return { items: rows.map((row) => toRoadmapItem(row as RoadmapRow)) }
  }

  async createRoadmap(input: CreateRoadmapItem, userId: string): Promise<RoadmapItem> {
    try {
      const row = await this.prisma.roadmapItem.create({
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description,
          status: ROADMAP_STATUS_TO_DB[input.status],
          position: input.position,
          visibility: VISIBILITY_TO_DB[input.visibility],
          createdById: userId,
          updatedById: userId,
        },
        include: { _count: { select: { votes: true } } },
      })
      return toRoadmapItem(row as RoadmapRow)
    } catch (error) {
      if (isUniqueError(error)) throw new PublicContentConflictError()
      throw error
    }
  }

  async updateRoadmap(id: string, input: UpdateRoadmapItem, userId: string): Promise<RoadmapItem> {
    await this.requireRoadmap(id)
    try {
      const row = await this.prisma.roadmapItem.update({
        where: { id },
        data: {
          ...input,
          status: input.status ? ROADMAP_STATUS_TO_DB[input.status] : undefined,
          visibility: input.visibility ? VISIBILITY_TO_DB[input.visibility] : undefined,
          updatedById: userId,
        },
        include: { _count: { select: { votes: true } } },
      })
      return toRoadmapItem(row as RoadmapRow)
    } catch (error) {
      if (isUniqueError(error)) throw new PublicContentConflictError()
      throw error
    }
  }

  async listPublishedChangelog(): Promise<ListChangelogResponse> {
    const rows = await this.prisma.changelogEntry.findMany({
      where: { visibility: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    })
    return { entries: rows.map(toChangelogEntry) }
  }

  async getPublishedChangelog(slug: string): Promise<ChangelogEntry> {
    const row = await this.prisma.changelogEntry.findFirst({ where: { slug, visibility: 'PUBLISHED' } })
    if (!row) throw new PublicContentNotFoundError()
    return toChangelogEntry(row)
  }

  async listChangelog(): Promise<ListChangelogResponse> {
    const rows = await this.prisma.changelogEntry.findMany({ orderBy: [{ updatedAt: 'desc' }] })
    return { entries: rows.map(toChangelogEntry) }
  }

  async createChangelog(input: CreateChangelogEntry, userId: string): Promise<ChangelogEntry> {
    const visibility = VISIBILITY_TO_DB[input.visibility]
    try {
      const row = await this.prisma.changelogEntry.create({
        data: {
          slug: input.slug,
          version: input.version,
          title: input.title,
          summary: input.summary,
          body: input.body,
          tags: input.tags,
          visibility,
          publishedAt: publishedAtFor(input.visibility, input.publishedAt),
          createdById: userId,
          updatedById: userId,
        },
      })
      return toChangelogEntry(row)
    } catch (error) {
      if (isUniqueError(error)) throw new PublicContentConflictError()
      throw error
    }
  }

  async updateChangelog(id: string, input: UpdateChangelogEntry, userId: string): Promise<ChangelogEntry> {
    const current = await this.prisma.changelogEntry.findUnique({ where: { id } })
    if (!current) throw new PublicContentNotFoundError()
    const visibility = input.visibility ? VISIBILITY_TO_DB[input.visibility] : undefined
    try {
      const row = await this.prisma.changelogEntry.update({
        where: { id },
        data: {
          ...input,
          visibility,
          publishedAt: publishedAtFor(
            input.visibility ?? VISIBILITY_FROM_DB[current.visibility],
            input.publishedAt,
            current.publishedAt,
          ),
          updatedById: userId,
        },
      })
      return toChangelogEntry(row)
    } catch (error) {
      if (isUniqueError(error)) throw new PublicContentConflictError()
      throw error
    }
  }

  async vote(userId: string, roadmapItemId: string): Promise<VoteResponse> {
    const item = await this.prisma.roadmapItem.findFirst({ where: { id: roadmapItemId, visibility: 'PUBLISHED' } })
    if (!item) throw new PublicContentNotFoundError()
    try {
      await this.prisma.featureVote.create({ data: { userId, roadmapItemId } })
    } catch (error) {
      if (isUniqueError(error)) throw new FeatureVoteAlreadyExistsError()
      throw error
    }
    const voteCount = await this.prisma.featureVote.count({ where: { roadmapItemId } })
    return { itemId: roadmapItemId, voted: true, voteCount }
  }

  async removeVote(userId: string, roadmapItemId: string): Promise<VoteResponse> {
    await this.prisma.featureVote.deleteMany({ where: { userId, roadmapItemId } })
    const voteCount = await this.prisma.featureVote.count({ where: { roadmapItemId } })
    return { itemId: roadmapItemId, voted: false, voteCount }
  }

  async createFeatureRequest(input: CreateFeatureRequest, userId: string): Promise<FeatureRequest> {
    const row = await this.prisma.featureRequest.create({ data: { ...input, authorId: userId } })
    return toFeatureRequest(row)
  }

  async listMyFeatureRequests(userId: string): Promise<ListFeatureRequestsResponse> {
    const rows = await this.prisma.featureRequest.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    })
    return { requests: rows.map(toFeatureRequest) }
  }

  async listFeatureRequests(): Promise<ListAdminFeatureRequestsResponse> {
    const rows = await this.prisma.featureRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, username: true } } },
    })
    return { requests: rows.map(toAdminFeatureRequest) }
  }

  async moderateFeatureRequest(id: string, input: ModerateFeatureRequest): Promise<AdminFeatureRequest> {
    const row = await this.prisma.featureRequest.update({
      where: { id },
      data: {
        status: REQUEST_STATUS_TO_DB[input.status],
        roadmapItemId: input.roadmapItemId,
      },
      include: { author: { select: { id: true, username: true } } },
    })
    return toAdminFeatureRequest(row)
  }

  private async requireRoadmap(id: string): Promise<void> {
    const found = await this.prisma.roadmapItem.count({ where: { id } })
    if (found === 0) throw new PublicContentNotFoundError()
  }
}
