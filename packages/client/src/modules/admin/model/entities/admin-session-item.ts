export type AdminSessionItem = {
  id: string
  ip: string
  /** User agent já resumido (ex.: "Chrome 141 · Windows"). */
  device: string
  lastActiveAt: string
  isActiveNow: boolean
}
