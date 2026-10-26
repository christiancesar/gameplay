// Dados fictícios do modal do servidor, usados só nas stories.
import type { JoinRequestItem } from '@/modules/servers/model/entities/join-request-item'
import type { MemberItem } from '@/modules/servers/model/entities/member-item'
import type { RoomItem } from '@/modules/servers/model/entities/room-item'
import type { ServerInviteItem } from '@/modules/servers/model/entities/server-invite-item'

import { people } from './index'

const hour = 3_600_000
const at = (offset: number) => new Date(Date.now() + offset).toISOString()

const minute = 60_000

export const invites: ServerInviteItem[] = [
  {
    code: 'JH34SD32',
    link: 'https://gameplay.app/i/JH34SD32',
    createdBy: people.shinigame,
    createdAt: at(-12 * minute),
    expiresAt: at(48 * minute),
    status: { type: 'active' },
  },
  {
    code: 'K9PQ7MXA',
    link: 'https://gameplay.app/i/K9PQ7MXA',
    createdBy: people.kisnaider,
    createdAt: at(-50 * minute),
    expiresAt: at(10 * minute),
    status: { type: 'active' },
  },
  {
    code: 'B2RT8WQE',
    link: 'https://gameplay.app/i/B2RT8WQE',
    createdBy: people.shinigame,
    createdAt: at(-3 * hour),
    expiresAt: at(-2 * hour),
    status: { type: 'used', user: people.marreta, usedAt: at(-150 * minute) },
  },
  {
    code: 'ZZ81WQ2B',
    link: 'https://gameplay.app/i/ZZ81WQ2B',
    createdBy: people.kisnaider,
    createdAt: at(-26 * hour),
    expiresAt: at(-25 * hour),
    status: { type: 'expired' },
  },
  {
    code: 'P0LM4KTA',
    link: 'https://gameplay.app/i/P0LM4KTA',
    createdBy: people.shinigame,
    createdAt: at(-30 * hour),
    expiresAt: at(-29 * hour),
    status: { type: 'revoked' },
  },
]

export const requests: JoinRequestItem[] = [
  {
    id: 'j1',
    user: people.marreta,
    requestedAt: at(-20 * minute),
    invitedBy: people.shinigame.name,
  },
  {
    id: 'j2',
    user: people.lua,
    requestedAt: at(-26 * hour),
    invitedBy: people.kisnaider.name,
  },
]

export const members: MemberItem[] = [
  { id: 'm1', user: people.shinigame, role: 'owner', isMe: true },
  {
    id: 'm2',
    user: people.kisnaider,
    role: 'admin',
    isMe: false,
    joinedVia: { invitedBy: people.shinigame.name, joinedAt: at(-40 * 24 * hour) },
  },
  {
    id: 'm3',
    user: people.jacutinga,
    role: 'member',
    isMe: false,
    joinedVia: { invitedBy: people.kisnaider.name, joinedAt: at(-12 * 24 * hour) },
  },
  {
    id: 'm4',
    user: people.marreta,
    role: 'member',
    isMe: false,
    joinedVia: { invitedBy: people.shinigame.name, joinedAt: at(-150 * minute) },
  },
]

export const fullMembers: MemberItem[] = [
  ...members,
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `mx${index}`,
    user: { name: `Player${index + 5}`, username: `player${index + 5}`, avatarUrl: undefined },
    role: 'member' as const,
    isMe: false,
    joinedVia: {
      invitedBy: people.kisnaider.name,
      joinedAt: at(-(index + 1) * 24 * hour),
    },
  })),
]

export const settingsRooms: RoomItem[] = [
  { id: 'r1', name: 'Room 01', occupants: 3 },
  { id: 'r2', name: 'Room 02', occupants: 0 },
]
