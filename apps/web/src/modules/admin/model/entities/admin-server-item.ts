export type AdminServerItem = {
  id: string
  name: string
  iconUrl?: string
  ownerName: string
  members: CountWithLimit
  rooms: CountWithLimit
}

export type CountWithLimit = { count: number; limit: number; isOverride: boolean }
