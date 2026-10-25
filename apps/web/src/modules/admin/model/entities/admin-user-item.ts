export type AdminUserItem = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  isOnline: boolean
  isSuspended: boolean
  isPlatformAdmin: boolean
  sessionCount: number
  /** Limite efetivo e se vem de override. */
  serverLimit: { value: number; isOverride: boolean }
  serversOwned: number
}
