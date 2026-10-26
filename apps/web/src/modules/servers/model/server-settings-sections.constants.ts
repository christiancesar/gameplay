const SERVER_SETTINGS_SECTIONS = ['general', 'invites', 'requests', 'members', 'rooms', 'danger'] as const
type ServerSettingsSection = (typeof SERVER_SETTINGS_SECTIONS)[number]

export { SERVER_SETTINGS_SECTIONS }
export type { ServerSettingsSection }
