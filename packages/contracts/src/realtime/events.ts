import { z } from 'zod'
import type { NotificationNew } from '../notifications/notification.js'
import type { Ack } from './ack.js'

// Socket.IO event names (`domain:action`). The direction lives in the
// ClientToServerEvents / ServerToClientEvents types, not in the name.
export const REALTIME_EVENTS = {
  serverSubscribe: 'server:subscribe',
  presenceSnapshot: 'presence:snapshot',
  presenceUpdate: 'presence:update',
  serverChanged: 'server:changed',
  serverRemoved: 'server:removed',
  sessionRevoked: 'session:revoked',
  roomJoin: 'room:join',
  roomLeave: 'room:leave',
  roomParticipants: 'room:participants',
  roomLeft: 'room:left',
  voiceState: 'voice:state',
  streamStart: 'stream:start',
  streamStop: 'stream:stop',
  streamWatch: 'stream:watch',
  streamUnwatch: 'stream:unwatch',
  streamQuality: 'stream:quality',
  streamWatchRequest: 'stream:watch-request',
  signalSend: 'signal:send',
  signalReceive: 'signal:receive',
  notificationNew: 'notification:new',
  mediaChanged: 'media:changed',
  streamEnded: 'stream:ended',
} as const

// Client asks to follow the server it has open. One server per socket:
// subscribing to another one stops the previous.
export const serverSubscribeSchema = z.object({ serverId: z.string().min(1) })
export type ServerSubscribe = z.infer<typeof serverSubscribeSchema>

export const STREAM_PRESETS = ['720p30', '720p60', '1080p30', '1080p60'] as const
export const streamPresetSchema = z.enum(STREAM_PRESETS)
export type StreamPreset = z.infer<typeof streamPresetSchema>

// How a screen share reaches the viewers: through the Cloudflare SFU, or
// straight from the streamer to each viewer (mesh).
export const STREAM_MODES = ['sfu', 'mesh'] as const
export const streamModeSchema = z.enum(STREAM_MODES)
export type StreamMode = z.infer<typeof streamModeSchema>

// Someone in a voice room. streaming is the preset of their screen share and
// streamMode how it is sent; both null when not sharing.
export const participantSchema = z.object({
  userId: z.string(),
  muted: z.boolean(),
  deafened: z.boolean(),
  streaming: streamPresetSchema.nullable(),
  streamMode: streamModeSchema.nullable(),
})
export type Participant = z.infer<typeof participantSchema>

// Who is in a voice room, in join order. Rooms nobody is in are left out.
export const roomOccupancySchema = z.object({
  roomId: z.string(),
  participants: z.array(participantSchema),
})
export type RoomOccupancy = z.infer<typeof roomOccupancySchema>

// Sent to the subscribing socket: which members are online right now and
// who is in each voice room.
export const presenceSnapshotSchema = z.object({
  serverId: z.string(),
  onlineUserIds: z.array(z.string()),
  rooms: z.array(roomOccupancySchema),
})
export type PresenceSnapshot = z.infer<typeof presenceSnapshotSchema>

// A member opened their first tab (online) or closed the last one (offline).
export const presenceUpdateSchema = z.object({
  serverId: z.string(),
  userId: z.string(),
  online: z.boolean(),
})
export type PresenceUpdate = z.infer<typeof presenceUpdateSchema>

// Something of the server changed (details, rooms, members, join requests).
// The web invalidates the server queries; REST stays the source of the data.
export const serverChangedSchema = z.object({ serverId: z.string() })
export type ServerChanged = z.infer<typeof serverChangedSchema>

export const SERVER_REMOVED_REASONS = ['kicked', 'left', 'deleted'] as const
// Sent to each removed person; their sockets stop following the server.
// "left" reaches the other tabs of who left.
export const serverRemovedSchema = z.object({
  serverId: z.string(),
  reason: z.enum(SERVER_REMOVED_REASONS),
})
export type ServerRemoved = z.infer<typeof serverRemovedSchema>

// One voice room per person: joining another one (in any tab) leaves the
// previous. muted and deafened are the state to enter with.
export const roomJoinSchema = z.object({
  roomId: z.string().min(1),
  muted: z.boolean().default(false),
  deafened: z.boolean().default(false),
})
export type RoomJoin = z.input<typeof roomJoinSchema>
export const roomJoinResultSchema = z.object({ participants: z.array(participantSchema) })
export type RoomJoinResult = z.infer<typeof roomJoinResultSchema>

// Sent to everyone following the server and to the room itself.
export const roomParticipantsSchema = z.object({
  serverId: z.string(),
  roomId: z.string(),
  participants: z.array(participantSchema),
})
export type RoomParticipants = z.infer<typeof roomParticipantsSchema>

// The socket is out of the voice room without asking: the person joined
// from another tab, the room was deleted, or they left the server.
export const ROOM_LEFT_REASONS = ['other-tab', 'room-deleted', 'removed'] as const
export const roomLeftSchema = z.object({ roomId: z.string(), reason: z.enum(ROOM_LEFT_REASONS) })
export type RoomLeft = z.infer<typeof roomLeftSchema>

export const voiceStateSchema = z.object({ muted: z.boolean(), deafened: z.boolean() })
export type VoiceState = z.infer<typeof voiceStateSchema>

// With sfu, the screen must already be published through /api/media/sfu.
export const streamStartSchema = z.object({ preset: streamPresetSchema, mode: streamModeSchema.default('mesh') })
export type StreamStart = z.input<typeof streamStartSchema>

// Viewer to streamer (same room). The streamer only sends the screen to
// who asked to watch.
// The platform admin changed the media resources of a server (serverId) or of
// the whole platform (null): refetch what the server offers.
export const mediaChangedSchema = z.object({ serverId: z.string().nullable(), turnOff: z.boolean() })
export type MediaChanged = z.infer<typeof mediaChangedSchema>

// To the streamer whose share was stopped by the API, not by them.
export const STREAM_ENDED_REASONS = ['disabled'] as const
export const streamEndedSchema = z.object({ reason: z.enum(STREAM_ENDED_REASONS) })
export type StreamEnded = z.infer<typeof streamEndedSchema>

export const streamTargetSchema = z.object({ streamerId: z.string().min(1) })
export type StreamTarget = z.infer<typeof streamTargetSchema>

export const STREAM_QUALITY_LEVELS = ['auto', 'high', 'medium', 'low'] as const
export const streamQualityLevelSchema = z.enum(STREAM_QUALITY_LEVELS)
export type StreamQualityLevel = z.infer<typeof streamQualityLevelSchema>
export const streamQualitySchema = streamTargetSchema.extend({ level: streamQualityLevelSchema })
export type StreamQuality = z.infer<typeof streamQualitySchema>

// What the streamer receives about one viewer.
export const streamViewerSchema = z.object({ viewerId: z.string() })
export type StreamViewer = z.infer<typeof streamViewerSchema>
export const streamViewerQualitySchema = streamViewerSchema.extend({ level: streamQualityLevelSchema })
export type StreamViewerQuality = z.infer<typeof streamViewerQualitySchema>

// WebRTC signaling, relayed only between people in the same voice room.
// data is the SDP or the ICE candidate, opaque to the API.
export const SIGNAL_KINDS = ['offer', 'answer', 'candidate'] as const
export const signalSendSchema = z.object({
  to: z.string().min(1),
  kind: z.enum(SIGNAL_KINDS),
  data: z.unknown(),
})
export type SignalSend = z.infer<typeof signalSendSchema>
export const signalReceiveSchema = z.object({
  from: z.string(),
  kind: z.enum(SIGNAL_KINDS),
  data: z.unknown(),
})
export type SignalReceive = z.infer<typeof signalReceiveSchema>

// Every client event takes an ack, answered with { ok } or { ok: false, error }.
export interface ClientToServerEvents {
  'server:subscribe': (payload: ServerSubscribe, ack: Ack) => void
  'room:join': (payload: RoomJoin, ack: Ack<RoomJoinResult>) => void
  'room:leave': (payload: Record<string, never>, ack: Ack) => void
  'voice:state': (payload: VoiceState, ack: Ack) => void
  'stream:start': (payload: StreamStart, ack: Ack) => void
  'stream:stop': (payload: Record<string, never>, ack: Ack) => void
  'stream:watch': (payload: StreamTarget, ack: Ack) => void
  'stream:unwatch': (payload: StreamTarget, ack: Ack) => void
  'stream:quality': (payload: StreamQuality, ack: Ack) => void
  'signal:send': (payload: SignalSend, ack: Ack) => void
}

export interface ServerToClientEvents {
  'presence:snapshot': (payload: PresenceSnapshot) => void
  'presence:update': (payload: PresenceUpdate) => void
  'server:changed': (payload: ServerChanged) => void
  'server:removed': (payload: ServerRemoved) => void
  // Suspended or sessions ended by the platform admin; the socket is closed next.
  'session:revoked': () => void
  'room:participants': (payload: RoomParticipants) => void
  'room:left': (payload: RoomLeft) => void
  'stream:watch-request': (payload: StreamViewer) => void
  'stream:unwatch': (payload: StreamViewer) => void
  'stream:quality': (payload: StreamViewerQuality) => void
  'signal:receive': (payload: SignalReceive) => void
  'notification:new': (payload: NotificationNew) => void
  'media:changed': (payload: MediaChanged) => void
  'stream:ended': (payload: StreamEnded) => void
}
