import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { defaultShareSettings, type ShareSettings } from '@/modules/screen-share/model/entities/share'
import {
  toSharePanelState,
  toViewerQualities,
  type ViewerProfile,
} from '@/modules/screen-share/model/mappers/share-panel.mapper'
import { audioSupportFor } from '@/modules/screen-share/model/rules/audio-support'

import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'
import { shareController } from './share.controller'

type Dialog = 'closed' | 'start' | 'update'

/** The share panel (F9): the idle button, the setup dialog, the monitor and its details. */
function useSharePanelViewModel(profiles: Readonly<Record<string, ViewerProfile>>) {
  const { t } = useTranslation()
  const snapshot = useShareStore()
  const saved = useSharePreferencesStore((state) => state.saved)
  const [dialog, setDialog] = useState<Dialog>('closed')
  const [draft, setDraft] = useState<ShareSettings>(saved ?? defaultShareSettings)
  const [saveAsDefault, setSaveAsDefault] = useState(saved !== null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { notice } = snapshot
  useEffect(() => {
    if (!notice) return
    toast.error(t(`share.notices.${notice}`))
    shareController.dismissNotice()
  }, [notice, t])

  // The details table has nothing to show once the share is over.
  const live = snapshot.status === 'live'

  function openSetup() {
    setDraft(saved ?? defaultShareSettings)
    setSaveAsDefault(saved !== null)
    setDetailsOpen(false)
    setDialog('start')
  }

  function start() {
    const includeAudio = draft.includeAudio && audioSupportFor(draft.source) !== 'unsupported'
    const settings = { ...draft, includeAudio }
    const { save, clear } = useSharePreferencesStore.getState()
    if (saveAsDefault) save(settings)
    else clear()
    setDialog('closed')
    void shareController.start(settings, snapshot.priority)
  }

  function openUpdate() {
    setDraft(snapshot.settings)
    setDialog('update')
  }

  function applyQuality() {
    setDialog('closed')
    void shareController.updateQuality(
      { ...snapshot.settings, resolution: draft.resolution, fps: draft.fps },
      snapshot.priority,
    )
  }

  return {
    panel: toSharePanelState(snapshot),
    setup: {
      open: dialog !== 'closed',
      mode: dialog === 'update' ? ('update' as const) : ('start' as const),
      settings: draft,
      audioSupport: audioSupportFor(draft.source),
      saveAsDefault,
      onOpenChange: (open: boolean) => {
        if (!open) setDialog('closed')
      },
      onChange: setDraft,
      onSaveAsDefaultChange: setSaveAsDefault,
      onStart: dialog === 'update' ? applyQuality : start,
    },
    details: {
      open: detailsOpen && live,
      target: { resolution: snapshot.settings.resolution, fps: snapshot.settings.fps },
      viewers: toViewerQualities(snapshot, profiles),
      onOpenChange: setDetailsOpen,
    },
    onStart: openSetup,
    onStop: () => void shareController.stop(),
    onOpenDetails: () => setDetailsOpen(true),
    onChangeQuality: openUpdate,
  }
}

export { useSharePanelViewModel }
export type { ViewerProfile }
