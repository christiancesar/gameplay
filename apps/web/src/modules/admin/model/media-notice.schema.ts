import { ANNOUNCEMENT_MESSAGE_MAX, ANNOUNCEMENT_TITLE_MAX, MEDIA_NOTICE_AUDIENCES } from '@gameplay/contracts'
import { z } from 'zod'

import type { AnnouncementError } from '@/modules/admin/model/announcement.schema'

/** Aviso enviado junto com o desligamento de um recurso de mídia. Mensagens: chaves de `admin.announcements.errors`. */
const mediaNoticeFormSchema = z.object({
  title: z.string().trim().min(1, 'required').max(ANNOUNCEMENT_TITLE_MAX, 'titleTooLong'),
  message: z.string().trim().min(1, 'required').max(ANNOUNCEMENT_MESSAGE_MAX, 'messageTooLong'),
  audience: z.enum(MEDIA_NOTICE_AUDIENCES),
})

type MediaNoticeValues = z.infer<typeof mediaNoticeFormSchema>

export { mediaNoticeFormSchema }
export type { AnnouncementError as MediaNoticeError, MediaNoticeValues }
