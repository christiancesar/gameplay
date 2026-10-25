import type { Preferences, ProfileRecord } from '../../domain/account'
import { type Avatar, ProfilesRepository } from '../profiles.repository'

export class InMemoryProfilesRepository extends ProfilesRepository {
  readonly profiles = new Map<string, ProfileRecord>()

  add(overrides: Partial<ProfileRecord> & { id: string }): ProfileRecord {
    const profile: ProfileRecord = {
      email: `${overrides.id}@example.com`,
      username: overrides.id,
      displayUsername: null,
      image: null,
      avatarKey: null,
      theme: 'dark',
      locale: null,
      ...overrides,
    }
    this.profiles.set(profile.id, profile)
    return profile
  }

  async find(userId: string): Promise<ProfileRecord | null> {
    return this.profiles.get(userId) ?? null
  }

  async updatePreferences(userId: string, preferences: Preferences): Promise<void> {
    const profile = this.profiles.get(userId)
    if (profile) this.profiles.set(userId, { ...profile, ...preferences })
  }

  async setAvatar(userId: string, avatar: Avatar | null): Promise<void> {
    const profile = this.profiles.get(userId)
    if (profile) this.profiles.set(userId, { ...profile, image: avatar?.image ?? null, avatarKey: avatar?.key ?? null })
  }
}
