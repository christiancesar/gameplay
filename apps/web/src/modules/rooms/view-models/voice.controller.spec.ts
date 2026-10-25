import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/socket', async () => {
  const { fakeSocket } = await import('@/modules/realtime/view-models/test/fake-socket.instance')
  return { createSocket: () => fakeSocket }
})

import { fakeSocket } from '@/modules/realtime/view-models/test/fake-socket.instance'
import { VoiceSession } from '@/modules/rooms/model/services/voice-session.service'

import { useAudioPreferencesStore } from './stores/audio-preferences.store'
import { voiceController } from './voice.controller'

describe('voiceController', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    fakeSocket.reset()
    useAudioPreferencesStore.setState({ inputDeviceId: undefined, outputDeviceId: undefined })
  })

  it('follows the devices chosen in the settings while attached', () => {
    const input = vi.spyOn(VoiceSession.prototype, 'setInputDevice').mockResolvedValue()
    const output = vi.spyOn(VoiceSession.prototype, 'setOutputDevice').mockImplementation(() => undefined)
    voiceController.attach(new QueryClient())
    useAudioPreferencesStore.getState().setInputDevice('mic-2')
    useAudioPreferencesStore.getState().setOutputDevice('spk-2')
    expect(input).toHaveBeenCalledWith('mic-2')
    expect(output).toHaveBeenCalledWith('spk-2')
    voiceController.detach()
    useAudioPreferencesStore.getState().setInputDevice('mic-3')
    expect(input).toHaveBeenCalledTimes(1)
  })

  it('ends the call on detach', () => {
    const leave = vi.spyOn(VoiceSession.prototype, 'leave').mockResolvedValue()
    voiceController.attach(new QueryClient())
    voiceController.detach()
    expect(leave).toHaveBeenCalledTimes(1)
  })
})
