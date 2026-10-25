import type { CollectedHardware, ManualHardware } from '@gameplay/contracts'

export type PageQuery = { search?: string; page: number; pageSize: number }

export type Page<T> = { items: T[]; total: number }

export type AdminUserRecord = {
  id: string
  username: string
  displayUsername: string | null
  email: string
  image: string | null
  role: 'user' | 'admin'
  suspended: boolean
  twoFactorEnabled: boolean
  // Own limit of servers; null follows the platform default.
  maxServersOverride: number | null
  ownedServerCount: number
  // Not expired.
  sessionCount: number
  createdAt: Date
}

export type AdminServerRecord = {
  id: string
  name: string
  iconKey: string | null
  owner: { id: string; username: string }
  memberCount: number
  roomCount: number
  maxMembersOverride: number | null
  maxRoomsOverride: number | null
  createdAt: Date
}

export type AdminDeviceRecord = {
  user: { id: string; username: string }
  deviceId: string
  collected: CollectedHardware
  manual: ManualHardware | null
  collectedAt: Date
}
