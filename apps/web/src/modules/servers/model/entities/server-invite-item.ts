export type ServerInviteItem = {
  code: string
  link: string
  createdBy: { name: string }
  createdAt: string
  expiresAt: string
  status:
    | { type: 'active' }
    | { type: 'used'; user: { name: string }; usedAt: string }
    | { type: 'expired' }
    | { type: 'revoked' }
}
