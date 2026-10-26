import { vi } from 'vitest'

import type { MicrophoneHandle, MicrophoneResult } from '@/shared/media/microphone'
import { fakeStream, fakeTrack } from '@/shared/media/test/media-fakes'

import { VoiceSession } from '../voice-session.service'
import { FakeAudioEngine } from './fake-audio-engine'
import { FakeCallMemory } from './fake-call-memory'
import { FakeMediaTransport } from './fake-media-transport'
import { FakeSpeakingWatcher } from './fake-speaking-watcher'
import { FakeVoiceRealtime } from './fake-voice-realtime'
import { FakeVoiceStore } from './fake-voice-store'
import { alone, iceWithTurn, selfId } from './voice-session-seed'

function makeMicrophone(): MicrophoneHandle {
  const track = fakeTrack('audio', 'mic')
  return { stream: fakeStream([track]), track }
}

/** A session wired to fakes. Every fake is exposed, and `engines`/`transports` list the ones it created. */
function makeVoiceSessionContext() {
  const realtime = new FakeVoiceRealtime()
  realtime.participants = alone
  const store = new FakeVoiceStore()
  const memory = new FakeCallMemory()
  const engines: FakeAudioEngine[] = []
  const transports: FakeMediaTransport[] = []
  const watchers: FakeSpeakingWatcher[] = []
  const microphones: MicrophoneHandle[] = []
  const state = {
    selfId: selfId as string | undefined,
    preferences: {
      inputDeviceId: undefined as string | undefined,
      outputDeviceId: undefined as string | undefined,
    },
    microphone: { ok: true } as { ok: true } | { ok: false; reason: 'denied' | 'unavailable' },
  }

  const acquireMicrophone = vi.fn(async (): Promise<MicrophoneResult> => {
    if (!state.microphone.ok) return state.microphone
    const microphone = makeMicrophone()
    microphones.push(microphone)
    return { ok: true, microphone }
  })
  const stopMicrophone = vi.fn()
  const loadIceConfig = vi.fn(async (_renewal: boolean) => iceWithTurn)

  const session = new VoiceSession({
    realtime,
    store,
    memory,
    getSelfId: () => state.selfId,
    getPreferences: () => state.preferences,
    acquireMicrophone,
    stopMicrophone,
    loadIceConfig,
    createEngine: () => {
      const engine = new FakeAudioEngine()
      engines.push(engine)
      return engine
    },
    createTransport: () => {
      const transport = new FakeMediaTransport()
      transports.push(transport)
      return transport
    },
    createSpeakingWatcher: (_engine, onChange) => {
      const watcher = new FakeSpeakingWatcher(onChange)
      watchers.push(watcher)
      return watcher
    },
  })

  return {
    session,
    realtime,
    store,
    memory,
    state,
    engines,
    transports,
    watchers,
    microphones,
    acquireMicrophone,
    stopMicrophone,
    loadIceConfig,
    get transport() {
      return transports[transports.length - 1]
    },
    get engine() {
      return engines[engines.length - 1]
    },
    get watcher() {
      return watchers[watchers.length - 1]
    },
  }
}

export { makeVoiceSessionContext }
