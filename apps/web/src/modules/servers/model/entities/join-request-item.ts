export type JoinRequestItem = {
  id: string
  /** `name` é o displayUsername (ou o username); e-mail de outra pessoa não chega aqui. */
  user: { name: string; username: string; avatarUrl?: string }
  requestedAt: string
  /** Quem criou o convite usado. */
  invitedBy: string
}
