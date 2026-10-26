import type { ServerRole } from '@gameplay/contracts'

export type MemberItem = {
  id: string
  /** `name` é o displayUsername (ou o username); e-mail de outra pessoa não chega aqui. */
  user: { name: string; username: string; avatarUrl?: string }
  role: ServerRole
  isMe: boolean
  /** Como entrou: quem criou o convite usado. Ausente para o owner, que criou o servidor. */
  joinedVia?: { invitedBy: string; joinedAt: string }
}
