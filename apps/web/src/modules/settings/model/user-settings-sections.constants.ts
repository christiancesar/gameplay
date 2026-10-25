const USER_SETTINGS_SECTIONS = ['profile', 'audio', 'appearance', 'hardware', 'account'] as const
type UserSettingsSection = (typeof USER_SETTINGS_SECTIONS)[number]

export { USER_SETTINGS_SECTIONS }
export type { UserSettingsSection }
