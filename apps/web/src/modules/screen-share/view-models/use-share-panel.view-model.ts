import type { StreamMode } from '@gameplay/contracts'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  defaultShareSettings,
  type SharePriority,
  type ShareSettings,
} from '@/modules/screen-share/model/entities/share'
import {
  toSharePanelState,
  toViewerQualities,
  type ViewerProfile,
} from '@/modules/screen-share/model/mappers/share-panel.mapper'
import { audioSupportFor, canShareAudio } from '@/modules/screen-share/model/rules/audio-support'
import { serverMediaQueryOptions } from '@/modules/screen-share/model/services/server-media.query'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'

import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'
import { shareController } from './share.controller'

type Dialog = 'closed' | 'start' | 'update'

/** The share panel (F9): the idle button, the setup dialog, the monitor and its details. */
function useSharePanelViewModel(profiles: Readonly<Record<string, ViewerProfile>>) {
  const { t } = useTranslation()
  const snapshot = useShareStore()
  const saved = useSharePreferencesStore((state) => state.saved)
  const savedPriority = useSharePreferencesStore((state) => state.savedPriority)
  const [dialog, setDialog] = useState<Dialog>('closed')
  const [draft, setDraft] = useState<ShareSettings>(saved ?? defaultShareSettings)
  const [draftPriority, setDraftPriority] = useState<SharePriority>(saved ? savedPriority : 'smooth')
  const [saveAsDefault, setSaveAsDefault] = useState(saved !== null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const serverId = useVoiceStore((state) => state.connection?.serverId)
  const { data: serverMedia } = useQuery({ ...serverMediaQueryOptions(serverId ?? ''), enabled: Boolean(serverId) })
  // Server (SFU) first whenever the server offers it; the choice is not remembered.
  const preferredMode: StreamMode | null = serverMedia
    ? serverMedia.sfu.available
      ? 'sfu'
      : serverMedia.mesh.available
        ? 'mesh'
        : null
    : 'mesh'
  const [pickedMode, setPickedMode] = useState<StreamMode | null>(null)
  const streamMode = pickedMode && serverMedia?.[pickedMode].available !== false ? pickedMode : preferredMode

  const { notice } = snapshot
  useEffect(() => {
    if (!notice) return
    // Without audio, or Direct instead of the server, the share still runs: a warning, not an error.
    const show = notice === 'no-audio' || notice === 'fell-back' ? toast.warning : toast.error
    show(t(`share.notices.${notice}`))
    shareController.dismissNotice()
  }, [notice, t])

  // The details table has nothing to show once the share is over.
  const live = snapshot.status === 'live'

  function openSetup() {
    setDraft(saved ?? defaultShareSettings)
    setDraftPriority(saved ? savedPriority : 'smooth')
    setSaveAsDefault(saved !== null)
    setPickedMode(null)
    setDetailsOpen(false)
    setDialog('start')
  }

  function start() {
    // A locked switch keeps its saved value; the share asks for no audio the browser cannot give.
    const settings = {
      ...draft,
      includeAudio: draft.includeAudio && canShareAudio(audioSupportFor(draft.source, shareController.platform())),
    }
    const { save, clear } = useSharePreferencesStore.getState()
    if (saveAsDefault) save(settings, draftPriority)
    else clear()
    setDialog('closed')
    if (!streamMode) return
    void shareController.start(settings, draftPriority, {
      mode: streamMode,
      // Without the server's answer the share is Direct already.
      fallbackToMesh: serverMedia?.mesh.available ?? true,
    })
  }

  function openUpdate() {
    setDraft(snapshot.settings)
    setDraftPriority(snapshot.priority)
    setDialog('update')
  }

  function applyQuality() {
    setDialog('closed')
    void shareController.updateQuality(
      { ...snapshot.settings, resolution: draft.resolution, fps: draft.fps },
      draftPriority,
    )
  }

  return {
    panel: toSharePanelState(snapshot),
    setup: {
      open: dialog !== 'closed',
      mode: dialog === 'update' ? ('update' as const) : ('start' as const),
      settings: draft,
      priority: draftPriority,
      audioSupport: audioSupportFor(draft.source, shareController.platform()),
      saveAsDefault,
      onOpenChange: (open: boolean) => {
        if (!open) setDialog('closed')
      },
      onChange: setDraft,
      onPriorityChange: setDraftPriority,
      onSaveAsDefaultChange: setSaveAsDefault,
      streamMode: streamMode ?? undefined,
      streamModes: serverMedia ? { sfu: serverMedia.sfu, mesh: serverMedia.mesh } : undefined,
      onStreamModeChange: setPickedMode,
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
