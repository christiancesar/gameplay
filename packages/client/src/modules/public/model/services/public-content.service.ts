import {
  createFeatureRequestSchema,
  featureRequestSchema,
  listChangelogResponseSchema,
  listRoadmapResponseSchema,
  voteResponseSchema,
  type CreateFeatureRequest,
  type ListChangelogResponse,
  type ListRoadmapResponse,
  type VoteResponse,
} from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

async function listPublicRoadmap(): Promise<ListRoadmapResponse> {
  const { data } = await http.get('/public/roadmap')
  return listRoadmapResponseSchema.parse(data)
}

async function listPublicChangelog(): Promise<ListChangelogResponse> {
  const { data } = await http.get('/public/changelog')
  return listChangelogResponseSchema.parse(data)
}

async function votePublicRoadmap(itemId: string): Promise<VoteResponse> {
  const { data } = await http.post(`/public/roadmap/${itemId}/vote`)
  return voteResponseSchema.parse(data)
}

async function removePublicRoadmapVote(itemId: string): Promise<VoteResponse> {
  const { data } = await http.delete(`/public/roadmap/${itemId}/vote`)
  return voteResponseSchema.parse(data)
}

async function createPublicFeatureRequest(input: CreateFeatureRequest) {
  const { data } = await http.post('/public/feature-requests', createFeatureRequestSchema.parse(input))
  return featureRequestSchema.parse(data)
}

export {
  createPublicFeatureRequest,
  listPublicChangelog,
  listPublicRoadmap,
  removePublicRoadmapVote,
  votePublicRoadmap,
}
