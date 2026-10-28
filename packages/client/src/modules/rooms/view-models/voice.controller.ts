import type { QueryClient } from '@tanstack/react-query'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { realtime } from '@/modules/realtime/model/services/realtime.service'
import { CallQualityReporter } from '@/modules/rooms/model/services/call-quality.service'
import { createCallMemory } from '@/modules/rooms/model/services/call-memory.service'
import { VoiceSession } from '@/modules/rooms/model/services/voice-session.service'
import type { CallMedia } from '@/shared/media/call-media'
import { WebAudioEngine, createBrowserAudioFactories } from '@/shared/media/audio-engine'
import { createBrowserMediaStream, createBrowserPeerConnection } from '@/shared/media/browser-media'
import { getIceConfig } from '@/shared/media/ice.service'
import { serverIceConfigQueryOptions } from '@/shared/media/ice.query'
import { MeshTransport } from '@/shared/media/mesh-transport'
import { acquireMicrophone, stopMicrophone } from '@/shared/media/microphone'
import { telemetry } from '@/shared/lib/telemetry/current-telemetry'
import { SpeakingDetector } from '@/shared/media/speaking-detector'

import { useAudioPreferencesStore } from './stores/audio-preferences.store'
import { useVoiceStore } from './stores/voice.store'

let queryClient: QueryClient | undefined
let session: VoiceSession | undefined
let stopPreferences: (() => void) | undefined
/** A reload goes back to the call the tab was in, once per page load. */
let resumePending = true
let resumeTimer: ReturnType<typeof setTimeout> | undefined

const memory = createCallMemory(() => sessionStorage)

/** Built on first use, so importing this module never touches the socket or the browser media APIs. */
function getSession(): VoiceSession {
  session ??= new VoiceSession({
    realtime,
    store: useVoiceStore,
    memory,
    getSelfId: () => queryClient?.getQueryData(sessionQueryOptions.queryKey)?.user.id,
    getPreferences: () => useAudioPreferencesStore.getState(),
    acquireMicrophone: (deviceId) => acquireMicrophone(deviceId),
    stopMicrophone,
    loadIceConfig: (renewal, serverId) => {
      const options = serverIceConfigQueryOptions(serverId)
      return queryClient
        ? queryClient.fetchQuery(renewal ? { ...options, staleTime: 0 } : options)
        : getIceConfig(serverId)
    },
    createEngine: () => new WebAudioEngine(createBrowserAudioFactories()),
    createTransport: ({ selfId, iceServers }) =>
      new MeshTransport({
        selfId,
        iceServers,
        createPeerConnection: createBrowserPeerConnection,
        createMediaStream: createBrowserMediaStream,
        signaling: {
          send: (to, kind, data) => realtime.sendSignal({ to, kind, data }),
          onSignal: (handler) => realtime.on('signal:receive', ({ from, kind, data }) => handler(from, kind, data)),
        },
      }),
    createSpeakingWatcher: (engine, onChange) =>
      new SpeakingDetector({ createMeter: (stream) => engine.createMeter(stream), onChange }),
  })
  // Call quality goes to whoever receives measurements; without one there is nothing to read the stats for.
  if (telemetry.measuring) {
    const current = session
    new CallQualityReporter({
      subscribeMedia: (handler) => current.subscribeMedia(handler),
      report: ({ values, context }) => telemetry.measure({ name: 'webrtc', values, attributes: context }),
    }).start()
  }
  return session
}

/**
 * Entry point of the voice call for ViewModels. One call per tab, held at module level like the socket:
 * the call must outlive any screen (the logo goes back to the Hub without leaving the room).
 */
const voiceController = {
  /** Called by the `_authed` layout: gives the call the query client and follows the audio settings. */
  attach(client: QueryClient) {
    queryClient = client
    stopPreferences?.()
    stopPreferences = useAudioPreferencesStore.subscribe((state, previous) => {
      if (state.inputDeviceId !== previous.inputDeviceId) void getSession().setInputDevice(state.inputDeviceId)
      if (state.outputDeviceId !== previous.outputDeviceId) getSession().setOutputDevice(state.outputDeviceId)
    })
    if (resumePending) {
      // Deferred, so a mount undone at once (StrictMode) cancels it in `detach` instead of starting a call.
      clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => {
        resumePending = false
        window.addEventListener('pagehide', () => memory.markLeft(Date.now()))
        void getSession().resume(Date.now())
      })
    }
  },
  /** The `_authed` layout went away (sign out): the call ends with it. */
  detach() {
    clearTimeout(resumeTimer)
    stopPreferences?.()
    stopPreferences = undefined
    void getSession().leave()
    queryClient = undefined
  },
  join: (serverId: string, roomId: string) => getSession().join(serverId, roomId),
  leave: () => getSession().leave(),
  toggleMute: () => getSession().toggleMute(),
  toggleDeafen: () => getSession().toggleDeafen(),
  setVolume: (userId: string, percent: number) => getSession().setVolume(userId, percent),
  dismissNotice: () => getSession().dismissNotice(),
  /** The media of the call in progress (or null), for screen share. */
  subscribeMedia: (handler: (media: CallMedia | null) => void) => getSession().subscribeMedia(handler),
}

/** Ends the call. For the sign-out ViewModel, which must not know how the call works. */
function leaveVoiceRoom() {
  return voiceController.leave()
}

export { leaveVoiceRoom, voiceController }
