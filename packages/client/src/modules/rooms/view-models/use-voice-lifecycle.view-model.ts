import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { voiceNoticeKey } from '@/modules/rooms/model/rules/voice-notice-key'

import { useVoiceStore } from './stores/voice.store'
import { voiceController } from './voice.controller'

/**
 * Ties the voice call to the `_authed` layout: the call can use the query client while the layout is
 * mounted and ends when it goes away (sign out). Also tells the user why a call ended on its own.
 */
function useVoiceLifecycleViewModel() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const notice = useVoiceStore((state) => state.notice)

  useEffect(() => {
    voiceController.attach(queryClient)
    return () => voiceController.detach()
  }, [queryClient])

  useEffect(() => {
    if (!notice) return
    toast.error(t(voiceNoticeKey(notice)))
    voiceController.dismissNotice()
  }, [notice, t])
}

export { useVoiceLifecycleViewModel }
