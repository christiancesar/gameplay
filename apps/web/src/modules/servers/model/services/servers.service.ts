import {
  listJoinRequestsResponseSchema,
  listMembersResponseSchema,
  listMyServersResponseSchema,
  serverDetailSchema,
  type CreateServerRequest,
  type JoinRequest,
  type ServerDetail,
  type ServerMember,
  type ServerSummary,
} from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

async function listMyServers(): Promise<ServerSummary[]> {
  const { data } = await http.get('/servers')
  return listMyServersResponseSchema.parse(data).servers
}

async function createServer(request: CreateServerRequest): Promise<ServerDetail> {
  const { data } = await http.post('/servers', request)
  return serverDetailSchema.parse(data)
}

/** The API crops and converts the file; the form field is `file`. */
async function uploadServerIcon(serverId: string, file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)
  await http.put(`/servers/${serverId}/icon`, body)
}

async function getServer(serverId: string): Promise<ServerDetail> {
  const { data } = await http.get(`/servers/${serverId}`)
  return serverDetailSchema.parse(data)
}

async function listServerMembers(serverId: string): Promise<ServerMember[]> {
  const { data } = await http.get(`/servers/${serverId}/members`)
  return listMembersResponseSchema.parse(data).members
}

/** Pending requests only; owner and admin. The API has no count endpoint, so the length is the count. */
async function listPendingJoinRequests(serverId: string): Promise<JoinRequest[]> {
  const { data } = await http.get(`/servers/${serverId}/join-requests`)
  return listJoinRequestsResponseSchema.parse(data).requests
}

async function leaveServer(serverId: string): Promise<void> {
  await http.post(`/servers/${serverId}/leave`)
}

export {
  createServer,
  getServer,
  leaveServer,
  listMyServers,
  listPendingJoinRequests,
  listServerMembers,
  uploadServerIcon,
}
