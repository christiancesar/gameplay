import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { shareController } from './share.controller'
import { useWatchStore } from './stores/watch.store'

type WatchSelection = {
  /** `?watch=` of the URL. */
  watchId: string | undefined
  /** The call is on this server's room and has its roster. */
  ready: boolean
  /** Whether no call is going on at all (nothing to watch from). */
  inCall: boolean
  /** Who is live in the room right now. */
  liveIds: readonly string[]
  /** Takes `?watch=` out of the URL. */
  onClose: () => void
}

/**
 * Keeps the watched screen and the URL in step. The URL asks, the session follows: a stream starts
 * when `?watch=` names someone live, and the view closes (URL cleared) when that person stops or the
 * call ends.
 */
function useWatchSelectionViewModel({ watchId, ready, inCall, liveIds, onClose }: WatchSelection) {
  const { t } = useTranslation()
  const failed = useWatchStore((state) => state.failed)
  const isLive = watchId !== undefined && liveIds.includes(watchId)

  useEffect(() => {
    if (!watchId) {
      shareController.stopWatching()
      return
    }
    if (!inCall) {
      onClose()
      return
    }
    if (!ready) return
    if (isLive) shareController.watch(watchId)
    else onClose()
  }, [watchId, ready, inCall, isLive, onClose])

  useEffect(() => {
    if (!failed) return
    toast.error(t('share.watchFailed'))
    shareController.dismissWatchFailure()
    onClose()
  }, [failed, onClose, t])
}

export { useWatchSelectionViewModel }
