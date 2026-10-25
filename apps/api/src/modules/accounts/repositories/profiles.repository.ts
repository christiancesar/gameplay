import type { Preferences, ProfileRecord } from '../domain/account'

export type Avatar = { image: string; key: string }

export abstract class ProfilesRepository {
  abstract find(userId: string): Promise<ProfileRecord | null>
  abstract updatePreferences(userId: string, preferences: Preferences): Promise<void>
  // null removes the avatar.
  abstract setAvatar(userId: string, avatar: Avatar | null): Promise<void>
}
