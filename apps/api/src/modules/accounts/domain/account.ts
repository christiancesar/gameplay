import type { CollectedHardware, Locale, ManualHardware, Theme } from '@gameplay/shared'

export type ProfileRecord = {
  id: string
  email: string
  username: string
  displayUsername: string | null
  image: string | null
  // Storage key of the current avatar, used to delete it on change.
  avatarKey: string | null
  theme: Theme
  locale: Locale | null
}

export type Preferences = { theme?: Theme; locale?: Locale | null }

export type DeviceReportRecord = {
  id: string
  userId: string
  deviceId: string
  collected: CollectedHardware
  manual: ManualHardware | null
  collectedAt: Date
}
