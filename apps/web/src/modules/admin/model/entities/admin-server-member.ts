export type AdminServerMember = {
  id: string
  user: { name: string; username: string; avatarUrl?: string }
  role: 'owner' | 'admin' | 'member'
  joinedVia?: { invitedBy: string; joinedAt: string }
}
