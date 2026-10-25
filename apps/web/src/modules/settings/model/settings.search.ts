import { z } from 'zod'

const USER_SETTINGS_SECTIONS = ['profile', 'audio', 'appearance', 'hardware', 'account'] as const
type UserSettingsSection = (typeof USER_SETTINGS_SECTIONS)[number]

/** Modal de configurações aberto pela URL, no Hub e na tela do servidor. */
const settingsSearchSchema = z.object({
  settings: z.enum(USER_SETTINGS_SECTIONS).optional(),
})

type SettingsSearch = z.infer<typeof settingsSearchSchema>

export { USER_SETTINGS_SECTIONS, settingsSearchSchema }
export type { SettingsSearch, UserSettingsSection }
