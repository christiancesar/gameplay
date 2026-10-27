import { ADMIN_PAGE_SIZE_MAX, type SendAnnouncementRequest } from '@gameplay/contracts'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { AnnouncementValues } from '@/modules/admin/model/announcement.schema'
import { adminServersQueryOptions } from '@/modules/admin/model/services/admin.query'
import { sendAnnouncement } from '@/modules/admin/model/services/admin.service'
import { useAdminErrorToast } from '@/modules/admin/view-models/use-admin-error-toast'

function toRequest({ title, message, audience, serverId }: AnnouncementValues): SendAnnouncementRequest {
  return { title, message, audience: audience === 'server' ? { type: 'server', serverId } : { type: 'everyone' } }
}

/** `/admin/announcements`: a notice for everyone or for one server's members, on the Hub and as a toast. */
function useAdminAnnouncementsViewModel() {
  const { t } = useTranslation()
  const onError = useAdminErrorToast()
  // The first page is enough for the group sizes the app is made for.
  const { data } = useQuery(adminServersQueryOptions({ pageSize: ADMIN_PAGE_SIZE_MAX }))
  // A new key gives the View an empty form after each send.
  const [formKey, setFormKey] = useState(0)

  const send = useMutation({
    mutationFn: sendAnnouncement,
    onSuccess: (recipients) => {
      toast.success(t('admin.announcements.sent', { count: recipients }))
      setFormKey((key) => key + 1)
    },
    onError,
  })

  return {
    formKey,
    servers: (data?.servers ?? []).map(({ id, name }) => ({ id, name })),
    isSending: send.isPending,
    onSend: (values: AnnouncementValues) => send.mutate(toRequest(values)),
  }
}

export { useAdminAnnouncementsViewModel }
