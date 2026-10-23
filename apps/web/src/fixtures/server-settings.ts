// Dados fictícios do modal do servidor, usados só nas stories.
import type { JoinRequestItem } from '@/modules/servers/views/settings/requests-section.view'
import type { MemberItem } from '@/modules/servers/views/settings/members-section.view'
import type { RoomItem } from '@/modules/servers/views/settings/rooms-section.view'
import type { ServerInviteItem } from '@/modules/servers/views/settings/invites-section.view'

import { people } from './index'

const hour = 3_600_000
const at = (offset: number) => new Date(Date.now() + offset).toISOString()

export const invites: ServerInviteItem[] = [
  { code: 'JH34SD32', link: 'https://gameplay.app/i/JH34SD32', usesLeft: 3, maxUses: 5, expiresAt: at(6 * 24 * hour), isExpired: false },
  { code: 'K9PQ7MXA', link: 'https://gameplay.app/i/K9PQ7MXA', usesLeft: 1, maxUses: 1, expiresAt: at(2 * hour), isExpired: false },
  { code: 'ZZ81WQ2B', link: 'https://gameplay.app/i/ZZ81WQ2B', usesLeft: 4, maxUses: 10, expiresAt: at(-5 * hour), isExpired: true },
]

export const requests: JoinRequestItem[] = [
  { id: 'j1', user: people.marreta, requestedAt: at(-20 * 60_000) },
  { id: 'j2', user: people.lua, requestedAt: at(-26 * hour) },
]

export const members: MemberItem[] = [
  { id: 'm1', user: people.shinigame, role: 'owner', isMe: true },
  { id: 'm2', user: people.kisnaider, role: 'admin', isMe: false },
  { id: 'm3', user: people.jacutinga, role: 'member', isMe: false },
  { id: 'm4', user: people.marreta, role: 'member', isMe: false },
]

export const fullMembers: MemberItem[] = [
  ...members,
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `mx${index}`,
    user: { name: `Player ${index + 5}`, email: `player${index + 5}@gameplay.com`, avatarUrl: undefined },
    role: 'member' as const,
    isMe: false,
  })),
]

export const settingsRooms: RoomItem[] = [
  { id: 'r1', name: 'Room 01', occupants: 3 },
  { id: 'r2', name: 'Room 02', occupants: 0 },
]
