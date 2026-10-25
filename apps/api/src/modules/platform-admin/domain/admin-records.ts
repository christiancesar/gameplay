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
  createdAt: Date
}

export type AdminServerRecord = {
  id: string
  name: string
  iconKey: string | null
  owner: { id: string; username: string }
  memberCount: number
  roomCount: number
  createdAt: Date
}
