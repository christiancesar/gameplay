import { ANNOUNCEMENT_MESSAGE_MAX, ANNOUNCEMENT_TITLE_MAX } from '@gameplay/contracts'
import { z } from 'zod'

/** Mensagens dos schemas: chaves de `admin.announcements.errors`, a View traduz. */
type AnnouncementError = 'required' | 'titleTooLong' | 'messageTooLong' | 'serverRequired'

const ANNOUNCEMENT_AUDIENCES = ['everyone', 'server'] as const
type AnnouncementAudienceOption = (typeof ANNOUNCEMENT_AUDIENCES)[number]

/** Aviso solto do admin: para todo mundo ou para os membros de um servidor. */
const announcementSchema = z
  .object({
    title: z.string().trim().min(1, 'required').max(ANNOUNCEMENT_TITLE_MAX, 'titleTooLong'),
    message: z.string().trim().min(1, 'required').max(ANNOUNCEMENT_MESSAGE_MAX, 'messageTooLong'),
    audience: z.enum(ANNOUNCEMENT_AUDIENCES),
    serverId: z.string(),
  })
  .refine((values) => values.audience !== 'server' || values.serverId !== '', {
    path: ['serverId'],
    message: 'serverRequired',
  })

type AnnouncementValues = z.infer<typeof announcementSchema>

export { ANNOUNCEMENT_AUDIENCES, announcementSchema }
export type { AnnouncementAudienceOption, AnnouncementError, AnnouncementValues }
