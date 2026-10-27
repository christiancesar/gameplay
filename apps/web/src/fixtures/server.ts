// Estado fictício da tela do servidor, usado só nas stories.
import type { SharePanelState } from '@/modules/screen-share/views/share-panel.view'
import type { ViewerQuality } from '@/modules/screen-share/views/share-details-dialog.view'
import type { StageParticipant } from '@/modules/rooms/model/entities/stage-participant'
import type { PresenceMember } from '@/modules/servers/model/entities/presence-member'
import type { SidebarRoom } from '@/modules/servers/model/entities/sidebar-room'

import { people, servers } from './index'

export const turbex = servers.turbex
export const myServers = Object.values(servers)

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

export const stageLongNames: StageParticipant[] = [
  { ...people.shinigame, ...stageBase, isMe: true, name: 'christiancesarrodriguessantos', isLive: true },
  { ...people.jacutinga, ...stageBase, name: 'Jacutinga da Silva Sauro Junior', isMuted: true, isLive: true },
]

// Estados ao vivo do painel de transmissão.

const target = { resolution: '1080p', fps: 60 } as const

export const liveOnTarget: SharePanelState = {
  status: 'live',
  source: 'window',
  target,
  delivering: { width: 1920, height: 1080, fps: 59.6, kbps: 8400 },
  isOnTarget: true,
  limitation: 'none',
  viewerCount: 2,
  audio: 'active',
}

/** Áudio pedido que o browser não entregou (Firefox, por exemplo). */
export const liveWithoutAudio: SharePanelState = { ...liveOnTarget, audio: 'missing' }

export const liveLimitedByNetwork: SharePanelState = {
  ...liveOnTarget,
  delivering: { width: 1280, height: 720, fps: 42, kbps: 2100 },
  isOnTarget: false,
  limitation: 'bandwidth',
  viewerCount: 3,
}

export const liveLimitedByCpu: SharePanelState = {
  ...liveOnTarget,
  source: 'screen',
  delivering: { width: 1920, height: 1080, fps: 27, kbps: 5200 },
  isOnTarget: false,
  limitation: 'cpu',
}

export const liveNoViewers: SharePanelState = {
  status: 'live',
  source: 'tab',
  target: { resolution: '720p', fps: 30 },
  isOnTarget: true,
  limitation: 'none',
  viewerCount: 0,
  audio: 'off',
}

export const viewerQualities: ViewerQuality[] = [
  {
    ...people.jacutinga,
    quality: { width: 1920, height: 1080, fps: 59.8, kbps: 8600 },
    isOnTarget: true,
    limitation: 'none',
  },
  {
    ...people.kisnaider,
    quality: { width: 1280, height: 720, fps: 48, kbps: 3100 },
    isOnTarget: false,
    limitation: 'bandwidth',
  },
  {
    ...people.marreta,
    quality: { width: 1280, height: 720, fps: 42, kbps: 2100 },
    isOnTarget: false,
    limitation: 'bandwidth',
  },
]

/** Membros do Turbex na ordem do ViewModel: papel, depois nome. */
export const presenceMembers: PresenceMember[] = [
  { ...people.shinigame, role: 'owner', isOnline: true },
  { ...people.kisnaider, role: 'admin', isOnline: true },
  { ...people.jacutinga, role: 'member', isOnline: true },
  { ...people.lua, role: 'member', isOnline: false },
  { ...people.marreta, role: 'member', isOnline: false },
]
