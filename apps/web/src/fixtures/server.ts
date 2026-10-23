// Estado fictício da tela do servidor, usado só nas stories.
import type { StageParticipant } from '@/modules/rooms/views/participant-tile.view'
import type { SidebarRoom } from '@/modules/servers/views/server-sidebar.view'

import { me, people, servers } from './index'

export const turbex = { ...servers.turbex, ownerName: me.name }

const base = { isMuted: false, isDeafened: false, isSpeaking: false, isLive: false }

export const roomsWithMe: SidebarRoom[] = [
  {
    id: 'r1',
    name: 'Room 01',
    participants: [
      { ...people.shinigame, ...base },
      { ...people.jacutinga, ...base, isMuted: true },
      { ...people.kisnaider, ...base, isSpeaking: true },
    ],
  },
  { id: 'r2', name: 'Room 02', participants: [] },
]

export const roomsWithoutMe: SidebarRoom[] = [
  {
    id: 'r1',
    name: 'Room 01',
    participants: [
      { ...people.jacutinga, ...base, isMuted: true },
      { ...people.kisnaider, ...base, isSpeaking: true, isLive: true },
    ],
  },
  { id: 'r2', name: 'Room 02', participants: [] },
]

const stageBase = { ...base, isMe: false, connection: 'connected' as const, volume: 100 }

export const stage: StageParticipant[] = [
  { ...people.shinigame, ...stageBase, isMe: true },
  { ...people.jacutinga, ...stageBase, isMuted: true },
  { ...people.kisnaider, ...stageBase, isSpeaking: true },
]

export const stageWithLive: StageParticipant[] = [
  { ...people.shinigame, ...stageBase, isMe: true },
  { ...people.jacutinga, ...stageBase, isMuted: true },
  { ...people.kisnaider, ...stageBase, isSpeaking: true, isLive: true },
  { ...people.marreta, ...stageBase, isLive: true },
]

export const stageConnecting: StageParticipant[] = [
  { ...people.shinigame, ...stageBase, isMe: true },
  { ...people.jacutinga, ...stageBase, connection: 'connecting' },
  { ...people.kisnaider, ...stageBase, connection: 'failed' },
  { ...people.lua, ...stageBase, isDeafened: true, isMuted: true, volume: 60 },
]

export const liveStats = { uploadKbps: 8400, bandwidthKbps: 9200, fps: 59.6, width: 1920, height: 1080 }
