import type { ServerRole } from '@gameplay/contracts'

export type PresenceMember = {
  id: string
  name: string
  avatarUrl?: string
  role: ServerRole
  /** Pelo menos uma aba conectada (presence:snapshot e presence:update). */
  isOnline: boolean
}
