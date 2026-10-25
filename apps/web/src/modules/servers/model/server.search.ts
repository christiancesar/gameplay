import { z } from 'zod'

const SERVER_SETTINGS_SECTIONS = ['general', 'invites', 'requests', 'members', 'rooms', 'danger'] as const
type ServerSettingsSection = (typeof SERVER_SETTINGS_SECTIONS)[number]

/** Estado da tela do servidor na URL. A sala de voz não entra aqui: vive na store de voz. */
const serverSearchSchema = z.object({
  serverSettings: z.enum(SERVER_SETTINGS_SECTIONS).optional(),
  /** userId de quem está sendo assistido (F10). */
  watch: z.string().optional(),
})

type ServerSearch = z.infer<typeof serverSearchSchema>

export { SERVER_SETTINGS_SECTIONS, serverSearchSchema }
export type { ServerSearch, ServerSettingsSection }
