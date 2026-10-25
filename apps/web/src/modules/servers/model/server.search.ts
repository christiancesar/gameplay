import { z } from 'zod'

import { SERVER_SETTINGS_SECTIONS, type ServerSettingsSection } from './server-settings-sections.constants'

/** Estado da tela do servidor na URL. A sala de voz não entra aqui: vive na store de voz. */
const serverSearchSchema = z.object({
  serverSettings: z.enum(SERVER_SETTINGS_SECTIONS).optional(),
  /** userId de quem está sendo assistido (F10). */
  watch: z.string().optional(),
})

type ServerSearch = z.infer<typeof serverSearchSchema>

export { SERVER_SETTINGS_SECTIONS, serverSearchSchema }
export type { ServerSearch, ServerSettingsSection }
