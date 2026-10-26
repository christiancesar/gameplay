import {
  listJoinRequestsResponseSchema,
  listMembersResponseSchema,
  listMyServersResponseSchema,
  listServerInvitesResponseSchema,
  myLimitsSchema,
  serverDetailSchema,
  serverInviteSchema,
  type CreateServerRequest,
  type JoinRequest,
  type MyLimits,
  type ServerInvite,
  type UpdateServerRequest,
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

async function updateServer(serverId: string, request: UpdateServerRequest): Promise<void> {
  await http.patch(`/servers/${serverId}`, request)
}

async function setServerAutoApprove(serverId: string, autoApprove: boolean): Promise<void> {
  await http.put(`/servers/${serverId}/auto-approve`, { autoApprove })
}

async function uploadServerCover(serverId: string, file: File): Promise<void> {
  const body = new FormData()
  body.append('file', file)
  await http.put(`/servers/${serverId}/cover`, body)
}

async function removeServerIcon(serverId: string): Promise<void> {
  await http.delete(`/servers/${serverId}/icon`)
}

async function removeServerCover(serverId: string): Promise<void> {
  await http.delete(`/servers/${serverId}/cover`)
}

async function deleteServer(serverId: string): Promise<void> {
  await http.delete(`/servers/${serverId}`)
}

async function listServerInvites(serverId: string): Promise<ServerInvite[]> {
  const { data } = await http.get(`/servers/${serverId}/invites`)
  return listServerInvitesResponseSchema.parse(data).invites
}

async function createServerInvite(serverId: string): Promise<ServerInvite> {
  const { data } = await http.post(`/servers/${serverId}/invites`)
  return serverInviteSchema.parse(data)
}

async function revokeServerInvite(serverId: string, inviteId: string): Promise<void> {
  await http.post(`/servers/${serverId}/invites/${inviteId}/revoke`)
}

async function listJoinRequests(serverId: string): Promise<JoinRequest[]> {
  const { data } = await http.get(`/servers/${serverId}/join-requests`)
  return listJoinRequestsResponseSchema.parse(data).requests
}

async function approveJoinRequest(serverId: string, requestId: string): Promise<void> {
  await http.post(`/servers/${serverId}/join-requests/${requestId}/approve`)
}

async function declineJoinRequest(serverId: string, requestId: string): Promise<void> {
  await http.post(`/servers/${serverId}/join-requests/${requestId}/decline`)
}

async function kickMember(serverId: string, userId: string): Promise<void> {
  await http.post(`/servers/${serverId}/members/${userId}/kick`)
}

async function promoteMember(serverId: string, userId: string): Promise<void> {
  await http.post(`/servers/${serverId}/members/${userId}/promote`)
}

async function demoteMember(serverId: string, userId: string): Promise<void> {
  await http.post(`/servers/${serverId}/members/${userId}/demote`)
}

async function createRoom(serverId: string, name: string): Promise<void> {
  await http.post(`/servers/${serverId}/rooms`, { name })
}

async function renameRoom(serverId: string, roomId: string, name: string): Promise<void> {
  await http.patch(`/servers/${serverId}/rooms/${roomId}`, { name })
}

async function deleteRoom(serverId: string, roomId: string): Promise<void> {
  await http.delete(`/servers/${serverId}/rooms/${roomId}`)
}

/** `roomIds` is every room of the server in the new order. */
async function reorderRooms(serverId: string, roomIds: string[]): Promise<void> {
  await http.put(`/servers/${serverId}/rooms/order`, { roomIds })
}

export {
  approveJoinRequest,
  createRoom,
  createServer,
  createServerInvite,
  declineJoinRequest,
  deleteRoom,
  deleteServer,
  demoteMember,
  getMyLimits,
  getServer,
  kickMember,
  leaveServer,
  listJoinRequests,
  listMyServers,
  listServerInvites,
  listServerMembers,
  promoteMember,
  removeServerCover,
  removeServerIcon,
  renameRoom,
  reorderRooms,
  revokeServerInvite,
  setServerAutoApprove,
  updateServer,
  uploadServerCover,
  uploadServerIcon,
}
