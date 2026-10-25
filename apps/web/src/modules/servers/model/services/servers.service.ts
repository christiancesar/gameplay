import {
  listMyServersResponseSchema,
  serverDetailSchema,
  type CreateServerRequest,
  type ServerDetail,
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

export { createServer, listMyServers, uploadServerIcon }
