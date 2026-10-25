import {
  listMembersResponseSchema,
  listMyServersResponseSchema,
  myLimitsSchema,
  serverDetailSchema,
  type CreateServerRequest,
  type MyLimits,
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

async function getMyLimits(): Promise<MyLimits> {
  const { data } = await http.get('/me/limits')
  return myLimitsSchema.parse(data)
}

async function leaveServer(serverId: string): Promise<void> {
  await http.post(`/servers/${serverId}/leave`)
}

export { createServer, getMyLimits, getServer, leaveServer, listMyServers, listServerMembers, uploadServerIcon }
