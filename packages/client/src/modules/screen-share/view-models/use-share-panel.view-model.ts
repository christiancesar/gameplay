/**
 * TODO: Analisar esse custom hook, ele está muito grande temos que encontrar uma forma de quebrar ele em partes pequenas deixar ele mais e especializado, seguindo boas práticas do SOLID.
 * Outro ponto que contém alguns ifs ternários concatenados. Exemplo:
 * ```
 *  const preferredMode: StreamMode | null = serverMedia
    ? serverMedia.sfu.available
      ? 'sfu'
      : serverMedia.mesh.available
        ? 'mesh'
        : null
    : 'mesh'
 * ```
 */
import type { StreamMode } from '@gameplay/contracts'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  recommendShareProfile,
  type ShareProfileRecommendation,
  type SourceProfile,
} from '@/modules/screen-share/model/rules/profile-recommendation'
import { serverMediaQueryOptions } from '@/modules/screen-share/model/services/server-media.query'
import { videoProfileCapabilities } from '@/modules/screen-share/model/services/video-profile-capabilities.service'
import { useVoiceStore } from '@/modules/rooms/view-models/stores/voice.store'
import type { CaptureSource } from '@/shared/platform/platform'
import { usePlatform } from '@/shared/platform/use-platform'

import { useSharePreferencesStore } from './stores/share-preferences.store'
import { useShareStore } from './stores/share.store'
import { shareController } from './share.controller'

type Dialog = 'closed' | 'start' | 'update'

/** The share panel (F9): the idle button, the setup dialog, the monitor and its details. */
function useSharePanelViewModel(profiles: Readonly<Record<string, ViewerProfile>>) {
  const { t } = useTranslation()
  const snapshot = useShareStore()
  const { kind, capabilities, capture } = usePlatform()
  const systemWithoutApp = capabilities.systemAudioWithoutApp
  // A host that lists screens and windows gets a grid; the desktop without the list (Wayland) leaves it to the system.
  const listSources = capabilities.listSources
  const systemPicker = kind === 'desktop' && !listSources
  const saved = useSharePreferencesStore((state) => state.saved)
  const savedPriority = useSharePreferencesStore((state) => state.savedPriority)
  const [dialog, setDialog] = useState<Dialog>('closed')
  // `saved` may come from before `audioApps` existed.
  const [draft, setDraft] = useState<ShareSettings>({ ...defaultShareSettings, ...saved })
  // The ids of the sources are only good for this run, so the choice is not part of the saved settings.
  const [sources, setSources] = useState<CaptureSource[]>([])
  const [sourceId, setSourceId] = useState<string | null>(null)
  // What the refresh compares the list with, which it cannot read from state without going stale.
  const sourceIdRef = useRef<string | null>(null)
  const sourceByKindRef = useRef<{ screen: string | null; window: string | null }>({ screen: null, window: null })
  const activeKindRef = useRef<'screen' | 'window'>('screen')
  const [draftPriority, setDraftPriority] = useState<SharePriority>(saved ? savedPriority : 'smooth')
  const [saveAsDefault, setSaveAsDefault] = useState(saved !== null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [advancedFps, setAdvancedFps] = useState<{
    sourceKey: string
    values: ShareProfileRecommendation['availableFps']
  }>({ sourceKey: 'null', values: [] })
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

  const profileSource: SourceProfile | null = useMemo(() => {
    const listed = sources.find((source) => source.id === sourceId)
    const liveSource = dialog === 'update' ? snapshot.source : null
    return listed
      ? { width: listed.width, height: listed.height, refreshRate: listed.refreshRate }
      : liveSource
        ? { width: liveSource.width, height: liveSource.height, refreshRate: liveSource.maxFps }
        : null
  }, [dialog, snapshot.source, sourceId, sources])
  const profileSourceKey = JSON.stringify(profileSource)
  const profileOptions = recommendShareProfile(
    profileSource,
    advancedFps.sourceKey === profileSourceKey ? advancedFps.values : [],
  )

  useEffect(() => {
    if (dialog === 'closed') return
    let current = true
    void videoProfileCapabilities.advancedFps(profileSource).then((values) => {
      if (current) setAdvancedFps({ sourceKey: profileSourceKey, values })
    })
    return () => {
      current = false
    }
  }, [dialog, profileSource, profileSourceKey])

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

  // Keep one selection per type while the dialog is open. A refreshed list may remove a source.
  const refreshSources = useCallback(() => {
    capture.listSources().then(
      (list) => {
        const kind = activeKindRef.current
        const chosen =
          list.find((source) => source.id === sourceByKindRef.current[kind] && source.kind === kind) ??
          list.find((source) => source.kind === kind)
        sourceIdRef.current = chosen?.id ?? null
        sourceByKindRef.current[kind] = sourceIdRef.current
        setSources(list)
        setSourceId(sourceIdRef.current)
      },
      () => {
        sourceIdRef.current = null
        setSources([])
        setSourceId(null)
      },
    )
  }, [capture])

  function selectSource(id: string) {
    const chosen = sources.find((source) => source.id === id)
    if (!chosen) return
    sourceIdRef.current = id
    sourceByKindRef.current[chosen.kind] = id
    setSourceId(id)
  }

  function changeSettings(next: ShareSettings) {
    if (listSources && next.source !== draft.source && (next.source === 'screen' || next.source === 'window')) {
      const kind = next.source
      activeKindRef.current = kind
      const chosen =
        sources.find((source) => source.id === sourceByKindRef.current[kind] && source.kind === kind) ??
        sources.find((source) => source.kind === kind)
      sourceIdRef.current = chosen?.id ?? null
      sourceByKindRef.current[kind] = sourceIdRef.current
      setSourceId(sourceIdRef.current)
    }
    setDraft(next)
  }

  function openSetup() {
    const initial = { ...defaultShareSettings, ...saved }
    setDraft(initial)
    sourceByKindRef.current = { screen: null, window: null }
    activeKindRef.current = initial.source === 'window' ? 'window' : 'screen'
    if (listSources) refreshSources()
    setDraftPriority(saved ? savedPriority : 'smooth')
    setSaveAsDefault(saved !== null)
    setPickedMode(null)
    setDetailsOpen(false)
    setDialog('start')
  }

  function start() {
    const fps = profileOptions.availableFps.includes(draft.fps) ? draft.fps : profileOptions.recommended.fps
    // A locked switch keeps its saved value; the share asks for no audio the host cannot give.
    const settings = {
      ...draft,
      fps,
      includeAudio:
        draft.includeAudio &&
        (systemWithoutApp || canShareAudio(audioSupportFor(draft.source, shareController.platform()))),
      audioApps: [],
    }
    const { save, clear } = useSharePreferencesStore.getState()
    if (saveAsDefault) save(settings, draftPriority)
    else clear()
    setDialog('closed')
    if (!streamMode) return
    const startMode = {
      mode: streamMode,
      // Without the server's answer the share is Direct already.
      fallbackToMesh: serverMedia?.mesh.available ?? true,
    }
    // Where the app lists them, the capture takes the source of the dialog; elsewhere the host's picker chooses.
    void (listSources
      ? shareController.start(settings, draftPriority, startMode, sourceId)
      : shareController.start(settings, draftPriority, startMode))
  }

  function openUpdate() {
    setDraft(snapshot.settings)
    setDraftPriority(snapshot.priority)
    setDialog('update')
  }

  function applyQuality() {
    setDialog('closed')
    const fps = profileOptions.availableFps.includes(draft.fps) ? draft.fps : profileOptions.recommended.fps
    void shareController.updateQuality(
      {
        ...snapshot.settings,
        resolution: draft.resolution,
        aspectRatio: draft.aspectRatio,
        fps,
      },
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
      audioSupport: systemWithoutApp
        ? draft.source === 'window' && capabilities.windowAudio
          ? ('windowApp' as const)
          : ('systemWithoutApp' as const)
        : audioSupportFor(draft.source, shareController.platform()),
      audioApps: undefined,
      sources: listSources
        ? {
            available: sources,
            selectedId: sourceId,
            onSelect: selectSource,
            onRefresh: refreshSources,
          }
        : undefined,
      systemPicker,
      profileOptions,
      saveAsDefault,
      onOpenChange: (open: boolean) => {
        if (!open) setDialog('closed')
      },
      onChange: changeSettings,
      onPriorityChange: setDraftPriority,
      onSaveAsDefaultChange: setSaveAsDefault,
      streamMode: streamMode ?? undefined,
      streamModes: serverMedia ? { sfu: serverMedia.sfu, mesh: serverMedia.mesh } : undefined,
      onStreamModeChange: setPickedMode,
      onStart: dialog === 'update' ? applyQuality : start,
    },
    details: {
      open: detailsOpen && live,
      target: {
        resolution: snapshot.settings.resolution,
        aspectRatio: snapshot.settings.aspectRatio,
        fps: snapshot.settings.fps,
      },
      viewers: toViewerQualities(snapshot, profiles),
      mode: snapshot.mode ?? 'mesh',
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
