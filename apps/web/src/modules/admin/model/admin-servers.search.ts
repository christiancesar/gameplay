import { z } from 'zod'

/** `/admin/servers?edit=<id>` abre o "Ajustar servidor" daquele servidor (vindo da aba Mídia). */
const adminServersSearchSchema = z.object({ edit: z.string().optional() })

export { adminServersSearchSchema }
