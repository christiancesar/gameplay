import { z } from 'zod'

import { USER_SETTINGS_SECTIONS, type UserSettingsSection } from './user-settings-sections.constants'

/** Modal de configurações aberto pela URL, no Hub e na tela do servidor. */
const settingsSearchSchema = z.object({
  settings: z.enum(USER_SETTINGS_SECTIONS).optional(),
})

type SettingsSearch = z.infer<typeof settingsSearchSchema>

export { USER_SETTINGS_SECTIONS, settingsSearchSchema }
export type { SettingsSearch, UserSettingsSection }
